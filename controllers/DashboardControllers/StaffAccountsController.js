const argon2 = require('argon2');
const StaffAccount = require('../../models/staff/StaffAccountSchema');
const AgentList = require('../../models/AgentListingSchema');

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}
function isRole(value) {
    return value === 'agent' || value === 'superadmin';
}

exports.createStaffAccount = async (req, res) => {
    try {
        const { email, name, password, role, agentLists } = req.body || {};
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