const AgentList = require('../models/AgentListingSchema');

// Webhook endpoint to upsert agents in bulk (from Google Sheet)
exports.upsertAgents = async (req, res) => {
    try {
        const agents = req.body.agents;
        if(!Array.isArray(agents)) {
            return res.status(400).json({ success: false, message: 'Invalid data format' });
        }
        // Bulk upsert by mlsId (change to 'email' if that's a unique field)
        const ops = agents.map(agent => ({
            updateOne: {
                filter: { mlsId: agent.mlsId },
                update: {
                    $set: {
                        fullName: agent.fullName,
                        mlsId: agent.mlsId,
                        aboutUs: agent.aboutUs,
                        licenseNumber: agent.licenseNumber,
                        knownAs: agent.knownAs,
                        licensedAs: agent.licensedAs,
                        licensedFor: agent.licensedFor,
                        personalRecCorpName: agent.personalRecCorpName,
                        phoneNumber: agent.phoneNumber,
                        secondaryPhone: agent.secondaryPhone,
                        email: agent.email,
                        joviEmail: agent.joviEmail,
                        teamName: agent.teamName,
                        photoUrl: agent.photoUrl,
                        officePhone: agent.officePhone,
                    }
                },
                upsert: true
            }
        }));
        
        if(ops.length > 0) {
            await AgentList.bulkWrite(ops);
        }

        res.status(200).json({ success: true, message: 'Agents upserted successfully', count: ops.length });

    } catch (err) {
        console.log('Upsert agents error: ', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Public endpoint: get all agents (sorted by full name)
exports.getAgents = async (req, res) => {
    try {
        const agents = await AgentList.find().sort({ fullName: 1 });
        res.status(200).json({success: true, agents});
    } catch (err) {
        res.status(500).json({ success: false, message: 'Agent not found' })
    }
};

// Public endpoint: get a single agent by MLS ID
exports.getAgentById = async (req, res) => {
    try {
        const agent = await AgentList.findOne({ licenseNumber: req.params.id });
        if(!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
        res.status(200).json({sucess: true, agent});
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.searchAgents = async (req, res) => {
    try {
        const { search='', page=1, limit=200 } = req.query;

        // Build search filter (update fields as needed)
        const searchFilter = search ? {
            $or: [
                { fullName: { $regex: search, $options: 'i' }},
                { email: { $regex: search, $options: 'i' }},
                { mlsId: { $regex: search, $options: 'i' }},
                { licenseNumber: { $regex: search, $options: 'i' }},
            ]
        }: {};

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get filtered and paginated agents
        const agents = await AgentList.find(searchFilter)
                        .sort({ fullName: 1 })
                        .skip(skip)
                        .limit(parseInt(limit));

        // Get total count for pagination
        const total = await AgentList.countDocuments(searchFilter);

        res.status(200)
            .json({ success: true, agents, page: parseInt(page), limit: parseInt(limit), total });

    } catch (err) {
        res.status(500).json({ success: false, message: 'server error' });
    }
};