const argon2 = require('argon2');
const AWS = require('aws-sdk');
const StaffAccount = require('../../models/staff/StaffAccountSchema');
const AgentList = require('../../models/AgentListingSchema');
const { default: mongoose } = require('mongoose');

// ---------------- Utilities ----------------
function normalizeEmail(email) {
  return String(email || '').trim();
}
function isRole(value) {
  return value === 'agent' || value === 'superadmin';
}

// DigitalOcean Spaces (S3-compatible)
const s3 = new AWS.S3({
  endpoint: process.env.SPACES_ENDPOINT, // e.g. "https://sfo3.digitaloceanspaces.com"
  accessKeyId: process.env.SPACES_KEY,
  secretAccessKey: process.env.SPACES_SECRET,
  s3ForcePathStyle: false,
  signatureVersion: 'v4',
});
async function uploadToSpaces(folder, file) {
  const keySafe = file.originalname.replace(/\s+/g, '_');
  const Key = `${folder}/${Date.now()}_${keySafe}`;
  await s3
    .putObject({
      Bucket: process.env.SPACES_BUCKET, // e.g. "media-jovirealty"
      Key,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
    })
    .promise();
  const base = process.env.SPACES_CDN || process.env.SPACES_ENDPOINT; // prefer CDN
  return `${base}/${Key}`;
}

// ---------------- CREATE ----------------
exports.createStaffAccount = async (req, res) => {
  try {
    const { email, name, password, role, agentLists, isSuperAdmin } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password || !name) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }
    const finalRole = isRole(role) ? role : 'agent';

    // uniqueness check in staff DB
    const exists = await StaffAccount.findOne({ email: normalizedEmail }).lean();
    if (exists) {
      return res.status(409).json({ error: 'Account already exists for this email' });
    }

    // Resolve agentListId for agents
    let agentListId = null;
    if (finalRole === 'agent') {
      if (agentLists?.id) {
        agentListId = agentLists.id;
      } else {
        const byEmail = await AgentList.findOne({
          $or: [{ email: normalizedEmail }, { joviEmail: normalizedEmail }],
        })
          .select({ _id: 1 })
          .lean();

        if (!byEmail) {
          return res.status(404).json({ error: 'Agent not found in agentlists' });
        }
        agentListId = byEmail._id;
      }
    }

    if (finalRole === 'superadmin') {
      agentListId = null;
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

// ---------------- LIST ----------------
// GET /v1/auth/staff/accounts?q=&page=&limit=
exports.listStaffAccounts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '25', 10)));
    const q = (req.query.q || '').trim();

    // Agents only (filter out superadmins)
    const base = { roles: { $in: ['agent'] }, agentListId: { $ne: null } };

    if (q) {
      base.$or = [{ email: { $regex: q, $options: 'i' } }, { fullName: { $regex: q, $options: 'i' } }];
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
            personalRealEstateCorporationName:
              a.personalRealEstateCorporationName || a.personalRecCorpName || null,
          },
        ])
      );
    }

    const accounts = staffDocs.map((s) => {
      const a = agentMap.get(String(s.agentListId));
      return {
        id: s._id,
        _id: s._id,
        email: s.email,
        roles: s.roles,
        isActive: !!s.isActive,
        agentListId: s.agentListId || null,
        photoUrl: a?.photoUrl || null,
        fullName: a?.fullName || s.fullName || null,
        licenseNumber: a?.licenseNumber || null,
        personalRealEstateCorporationName: a?.personalRealEstateCorporationName || null,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        lastLoginAt: s.lastLoginAt || null,
      };
    });

    res.json({ accounts, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    console.error('[listStaffAccounts]', error);
    res.status(500).json({ error: 'Internal error' });
  }
};

// ---------------- SHOW ----------------
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

    const a = await AgentList.findById(s.agentListId)
      .select(
        '_id fullName knownAs mlsId email joviEmail licenseNumber licensedAs personalRealEstateCorporationName personalRecCorpName licensedFor phoneNumber teamName aboutUs photoUrl'
      )
      .lean();

    if (!a) {
      return res.json({
        _id: s._id,
        email: s.email,
        roles: s.roles,
        agentListId: s.agentListId,
      });
    }

    const precName = a.personalRealEstateCorporationName || a.personalRecCorpName || null;

    return res.json({
      _id: s._id,
      email: s.email, // login email
      roles: s.roles,
      agentListId: s.agentListId,
      // Agent profile fields:
      fullName: a.fullName || null,
      knownAs: a.knownAs || null,
      mlsId: a.mlsId || null,
      joviEmail: a.joviEmail || null,
      licenseNumber: a.licenseNumber || null,
      licensedAs: a.licensedAs || null,
      personalRealEstateCorporationName: precName,
      licensedFor: a.licensedFor || null,
      phoneNumber: a.phoneNumber || null,
      teamName: a.teamName || null,
      aboutUs: a.aboutUs || null,
      photoUrl: a.photoUrl || null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      lastLoginAt: s.lastLoginAt || null,
    });
  } catch (error) {
    console.error('[getStaffAccount]', error);
    res.status(500).json({ error: 'Internal error' });
  }
};

// ---------- Lookup agent by email (email or joviEmail) ----------
exports.lookupAgentByEmail = async (req, res) => {
  try {
    const email = normalizeEmail(req.query.email || '');
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const row = await AgentList.findOne({
      $or: [
        { email: { $regex: `^${email}$`, $options: 'i' } },
        { joviEmail: { $regex: `^${email}$`, $options: 'i' } },
      ],
    })
      .select('_id fullName email joviEmail')
      .lean();
    if (!row) {
      return res.status(404).json({ error: 'Agent not found in database' });
    }

    const exists = await StaffAccount.findOne({ agentListId: row._id }).lean();
    if (exists) {
      return res.status(409).json({ error: 'Staff account already exists for this agent' });
    }

    res.json({ id: row._id, fullName: row.fullName, email: row.email, joviEmail: row.joviEmail });
  } catch (err) {
    console.error('[lookupAgentByEmail]', err);
    res.status(500).json({ error: 'Internal error' });
  }
};

// ---------------- UPDATE (agentLists + optional staff name sync) ----------------
// PUT /v1/auth/staff/accounts/:id/profile
exports.updateAgentAndStaffProfile = async (req, res) => {
  try {
    const { id } = req.params; // staff account id
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid staff account Id' });
    }

    const s = await StaffAccount.findById(id)
      .select('_id email fullName roles agentListId')
      .lean();
    if (!s) return res.status(404).json({ error: 'Staff account not found' });
    if (!s.agentListId)
      return res
        .status(400)
        .json({ error: 'This staff account is not linked to an agent profile' });

    const a = await AgentList.findById(s.agentListId).lean();
    if (!a) return res.status(404).json({ error: 'Agent profile not found' });

    const authEmail = String(s.email || '').toLowerCase();

    // Allowed & forbidden fields (accept typos/aliases)
    const allowed = new Set([
      'fullName',
      'email',
      'joviEmail',
      'knownAs',
      'licensedAs',
      'personalRealStateCorporationName', // incoming typo
      'personalRealEstateCorporationName', // canonical
      'licencedFor', // incoming typo
      'licensedFor', // canonical
      'PhoneNumber', // incoming casing
      'phoneNumber', // canonical
      'aboutUs',
      'photoUrl',
    ]);
    const forbidden = new Set(['mlsId', 'licenseNumber', 'officePhone']);

    const body = req.body || {};
    for (const k of Object.keys(body)) {
      if (forbidden.has(k)) {
        return res.status(400).json({ error: `Field '${k}' cannot be updated from this screen` });
      }
    }

    // Map incoming -> canonical
    const agentUpdate = {};
    const setIf = (from, to = from) => {
      if (Object.prototype.hasOwnProperty.call(body, from) && allowed.has(from)) {
        agentUpdate[to] = body[from];
      }
    };
    setIf('fullName');
    setIf('email');
    setIf('joviEmail');
    setIf('knownAs');
    setIf('licensedAs');
    setIf('personalRealStateCorporationName', 'personalRealEstateCorporationName');
    setIf('personalRealEstateCorporationName');
    setIf('licencedFor', 'licensedFor');
    setIf('licensedFor');
    setIf('PhoneNumber', 'phoneNumber');
    setIf('phoneNumber');
    setIf('aboutUs');
    setIf('photoUrl');

    // File upload -> Spaces URL
    if (req.file) {
      const url = await uploadToSpaces('Agents/AgentProfiles', req.file);
      agentUpdate.photoUrl = url;
    }

    // Email lock rule (auth email cannot change)
    const agentEmail = String(a.email || '').toLowerCase();
    const agentJoviEmail = String(a.joviEmail || '').toLowerCase();
    let authKey = null;
    if (agentEmail && agentEmail === authEmail) authKey = 'email';
    if (agentJoviEmail && agentJoviEmail === authEmail) authKey = 'joviEmail';

    if (authKey && Object.prototype.hasOwnProperty.call(agentUpdate, authKey)) {
      const newVal = String(agentUpdate[authKey] || '').toLowerCase();
      const oldVal = authKey === 'email' ? agentEmail : agentJoviEmail;
      if (newVal !== oldVal) {
        return res.status(400).json({
          error:
            'This email is used for authentication. If you need to change it, please contact an administrator.',
          field: authKey,
        });
      }
    }

    // 1) Update agentLists (jovidb)
    const updatedAgent = await AgentList.findByIdAndUpdate(
      s.agentListId,
      { $set: agentUpdate },
      { new: true }
    )
      .select(
        '_id fullName knownAs email joviEmail mlsId licenseNumber licensedAs personalRealEstateCorporationName licensedFor phoneNumber teamName aboutUs photoUrl'
      )
      .lean();

    // 2) Optionally sync staff full name (jovi_staff) — no transaction
    if (agentUpdate.fullName && agentUpdate.fullName.trim()) {
      await StaffAccount.findByIdAndUpdate(s._id, { $set: { fullName: agentUpdate.fullName.trim() } }).lean();
    }

    return res.json({
      _id: s._id,
      email: s.email, // login email (unchanged)
      roles: s.roles,
      agentListId: s.agentListId,
      fullName: updatedAgent?.fullName || null,
      knownAs: updatedAgent?.knownAs || null,
      joviEmail: updatedAgent?.joviEmail || null,
      mlsId: updatedAgent?.mlsId || null,
      licenseNumber: updatedAgent?.licenseNumber || null,
      licensedAs: updatedAgent?.licensedAs || null,
      personalRealEstateCorporationName:
        updatedAgent?.personalRealEstateCorporationName || null,
      licensedFor: updatedAgent?.licensedFor || null,
      phoneNumber: updatedAgent?.phoneNumber || null,
      teamName: updatedAgent?.teamName || null,
      aboutUs: updatedAgent?.aboutUs || null,
      photoUrl: updatedAgent?.photoUrl || null,
    });
  } catch (error) {
    console.error('[updateAgentAndStaffProfile]', error);
    res.status(500).json({ error: 'Internal error' });
  }
};

