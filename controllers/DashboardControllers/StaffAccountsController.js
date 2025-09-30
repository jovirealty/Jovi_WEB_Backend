const argon2 = require('argon2');
const StaffAccount = require('../../models/staff/StaffAccountSchema');
const AgentList = require('../../models/AgentListingSchema');
const { default: mongoose } = require('mongoose');

function normalizeEmail(email) {
    return String(email || '').trim();
}
function isRole(value) {
    return value === 'agent' || value === 'superadmin';
}

exports.createStaffAccount = async (req, res) => {
    try {
        const { email, name, password, role, agentLists, isSuperAdmin } = req.body || {};
        const normalizedEmail =  normalizeEmail(email);

        if(!normalizedEmail || !password || !name) {
            return res.status(400).json({error: 'Email, name, and password are required'});
        }
        const finalRole = isRole(role) ? role : 'agent';

        // uniqueness check in staff DB // galat
        const exists = await StaffAccount.findOne({ email: normalizedEmail }).lean();
        if(exists) {
            return res.status(409).json({ error: 'Account already exists for this email' });
        }

        // Resolve agentListId for agents
        let agentListId = null;
        if(finalRole === 'agent') {
            if(agentLists?.id) {
                // Use provided agent list ID
                agentListId = agentLists.id;
            } else {
                const byEmail = await AgentList
                    .findOne({ $or: [{ email: normalizedEmail }, { joviEmail: normalizedEmail }], })
                    .select({ _id: 1 }).lean();

                if(!byEmail) {
                    return res.status(404).json({ error: 'Agent not found in agentlists' });
                }
                agentListId = byEmail._id;
            }
        }

        if(finalRole === 'superadmin') {
            agentListId = null; // enforce rule explicitly 
        }

        const passwordHash = await argon2.hash(password);
        const doc = await StaffAccount.create({
            email: normalizedEmail,
            roles: [finalRole],
            passwordHash,
            mustChangePassword: false,
            passwordSetAt: new Date(),
            isActive: true,
            isSuspended: false,
            createdBy: req.user?._id || undefined,
            fullName: name,
            agentListId,
            isSuperAdmin,
        });

        return res.status(201).json({
            id: doc._id,
            email: doc.email,
            fullName: doc.fullName,
            roles: doc.roles,
            agentListId: doc.agentListId,
            createdAt: doc.createdAt,
        });
    } catch (error) {
        console.error('[createStaffAccount] Error creating staff account:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /v1/auth/staff/accounts?q=&page=&limit=
exports.listStaffAccounts = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '25', 10)));
    const q     = (req.query.q || '').trim();

    // Agents only (filter out superadmins)
    const base = {
      roles: { $in: ['agent'] },
      agentListId: { $ne: null },
    };

    if (q) {
      base.$or = [
        { email:    { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
      ];
    }

    const [staffDocs, total] = await Promise.all([
      StaffAccount.find(base)
        .select('_id email fullName roles isActive agentListId createdAt updatedAt lastLoginAt')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      StaffAccount.countDocuments(base),
    ]);

    // Batch fetch agents for these staff rows
    const agentIds = staffDocs.map((s) => s.agentListId).filter(Boolean);
    let agentMap = new Map();
    if (agentIds.length) {
      const agents = await AgentList.find({ _id: { $in: agentIds } })
        .select('_id photoUrl fullName licenseNumber personalRecCorpName personalRealEstateCorporationName')
        .lean();

      agentMap = new Map(
        agents.map((a) => [
          String(a._id),
          {
            photoUrl: a.photoUrl || null,
            fullName: a.fullName || null,
            licenseNumber: a.licenseNumber || null,
            // support either schema key
            personalRealEstateCorporationName:
              a.personalRealEstateCorporationName || a.personalRecCorpName || null,
          },
        ])
      );
    }

    // Merge & shape
    const accounts = staffDocs.map((s) => {
      const a = agentMap.get(String(s.agentListId));
      return {
        id: s._id,
        _id: s._id,
        email: s.email,
        roles: s.roles,
        isActive: !!s.isActive,
        agentListId: s.agentListId || null,
        // agent fields (if found)
        photoUrl: a?.photoUrl || null,
        fullName: a?.fullName || s.fullName || null,
        licenseNumber: a?.licenseNumber || null,
        personalRealEstateCorporationName: a?.personalRealEstateCorporationName || null,
        // optional display fields
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        lastLoginAt: s.lastLoginAt || null,
      };
    });

    res.json({
      accounts,
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error('[listStaffAccounts]', error);
    res.status(500).json({ error: 'Internal error' });
  }
};

// GET /v1/auth/staff/accounts/:id
exports.getStaffAccount = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid staff account ID' });
    }

    const s = await StaffAccount.findById(id)
      .select('_id email fullName roles agentListId isActive isSuperAdmin isSuspended createdAt updatedAt lastLoginAt')
      .lean();

    if (!s) return res.status(404).json({ error: 'Staff account not found' });

    const isAgent = Array.isArray(s.roles) && s.roles.includes('agent') && s.agentListId;
    if (!isAgent) {
      // superadmin or any non-agent role: return staff-only shape
      return res.json({
        _id: s._id,
        email: s.email,
        fullName: s.fullName || null,
        roles: s.roles,
        isActive: !!s.isActive,
        isSuperAdmin: !!s.isSuperAdmin,
        isSuspended: !!s.isSuspended,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        lastLoginAt: s.lastLoginAt || null,
      });
    }

    // Agent: enrich from agentlists
    const a = await AgentList.findById(s.agentListId)
      .select(
        '_id fullName mlsId email licenseNumber licensedAs personalRealEstateCorporationName personalRecCorpName licensedFor phoneNumber teamName aboutUs photoUrl'
      )
      .lean();

    if (!a) {
      // AgentList row missing — still return a minimal shape
      return res.json({
        _id: s._id,
        email: s.email,
        roles: s.roles,
        agentListId: s.agentListId,
      });
    }

    // Normalize keys (support both personalRealEstateCorporationName & personalRecCorpName)
    const precName =
      a.personalRealEstateCorporationName || a.personalRecCorpName || null;

    return res.json({
      _id: s._id,                       // staff account id
      email: s.email,                   // login email
      roles: s.roles,
      agentListId: s.agentListId,
      // Agent profile fields:
      fullName: a.fullName || null,
      mlsId: a.mlsId || null,
      licenseNumber: a.licenseNumber || null,
      licensedAs: a.licensedAs || null,
      personalRealEstateCorporationName: precName,
      licensedFor: a.licensedFor || null,
      phoneNumber: a.phoneNumber || null,
      teamName: a.teamName || null,
      aboutUs: a.aboutUs || null,
      photoUrl: a.photoUrl || null,
      // optional timestamps for UI
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      lastLoginAt: s.lastLoginAt || null,
    });
  } catch (error) {
    console.error('[getStaffAccount]', error);
    res.status(500).json({ error: 'Internal error' });
  }
};

// GET /staff/agent-lookup?email=
exports.lookupAgentByEmail = async (req, res) => {
    try {
        const email = normalizeEmail(req.query.email || '');
        if(!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const row = await AgentList
                    .findOne({
                        $or: [
                            { email:    { $regex: `^${email}$`, $options: 'i' } },
                            { joviEmail:{ $regex: `^${email}$`, $options: 'i' } },
                        ],
                    }).select('_id fullName email joviEmail').lean();
        if(!row) {
            return res.status(404).json({ error: 'Agent not found in database' });
        }

        // check if already a staff account
        const exists = await StaffAccount.findOne({ agentListId: row._id }).lean();
        if(exists) {
            return res.status(409).json({ error: 'Staff account already exists for this agent' });
        }

        res.json({
            id: row._id,
            fullName: row.fullName,
            email: row.email,
            joviEmail: row.joviEmail,
        });
    } catch(err) {
        console.error('[lookupAgentByEmail]', err);
        res.status(500).json({ error: 'Internal error' });
    }
}