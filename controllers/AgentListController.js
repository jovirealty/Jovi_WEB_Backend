const AgentList = require('../models/AgentListingSchema');

// Webhook endpoint to upsert agents in bulk (from Google Sheet)
exports.upsertAgents = async (req, res) => {
    try {
        const agents = req.body.agents;
        console.log("agents value: ", agents);
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
        const agent = await AgentList.findOne({ mlsId: req.params.id });
        if(!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
        res.status(200).json({sucess: true, agent});
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};