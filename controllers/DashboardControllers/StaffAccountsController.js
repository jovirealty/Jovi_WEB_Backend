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

        // uniqueness check in staff DB
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
            email: normalizeEmail,
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

// GET /staff/accounts?page=&limit=&q=
exports.listStaffAccounts = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '25', 10)));
        const q = (req.query.q || '').trim().toLowerCase();

        const filter = {};
        if (q) {
            filter.$or = [
                { email:    { $regex: q, $options: 'i' } },
                { fullName: { $regex: q, $options: 'i' } },
            ];
        }

        const [items, total] = await Promise.all([
            StaffAccount.find(filter)
                .select('_id email fullName roles agentListId isActive isSuperAdmin isSuspended createdAt updatedAt lastLoginAt')
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            StaffAccount.countDocuments(filter),
        ]);

        res.json({
            items,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit) || 1,
        });
    } catch (error) {
        console.error('[listStaffAccounts]', err);
        res.status(500).json({ error: 'Internal error' });
    }
};

// GET /staff/accounts/:id
exports.getStaffAccount = async (req, res) => {
    try {
        const { id } = req.params;
        if(!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid staff account ID' });
        }

        const doc = await StaffAccount.findById(id)
            .select('_id email fullName roles agentListId isActive isSuperAdmin isSuspended createdAt updatedAt lastLoginAt')
            .lean();
        
        if(!doc) {
            return res.status(404).json({ error: 'Staff account not found' });
        }
        return res.json(doc);
    } catch (error) {
        console.error('[getStaffAccount]', error);
        res.status(500).json({ error: 'Internal error' });
    }
};

// GET /staff/agent-lookup?email=
exports.lookupAgentByEmail = async (req, res) => {
    console.log(`lookupAgentByEmail: ${normalizeEmail(req.query.email)}`);
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
        
        console.log(`Found agent: '${row}`);
        if(!row) {
            return res.status(404).json({ error: 'Agent not found in database' });
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