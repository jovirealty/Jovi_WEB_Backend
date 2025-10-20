// controllers/StaffAddPropertyControllers/StaffLookupController.js
const StaffLookupService = require("../../../services/AddPropertyService/admin/StaffLookupService");

exports.lookup = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const agent = await StaffLookupService.findByEmailOrName(q);
    if (!agent) {
      return res.status(404).json({ found: false, message: "Agent not found" });
    }

    // Note: we only return the essentials the frontend needs to “unlock” AddProperty
    return res.status(200).json({
      found: true,
      agent: {
        staffId: agent.staffId,
        agentListId: agent.agentListId,
        fullName: agent.fullName,
        email: agent.email,
      },
    });
  } catch (err) {
    console.error("[StaffLookupController.lookup]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
