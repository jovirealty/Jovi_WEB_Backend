const StaffAccount = require("../../../models/staff/StaffAccountSchema");
const { normalizeEmail } = require("../../../util/NormalizeEmail/normalizeEmail");

exports.findByEmailOrName = async (q) => {
  const isEmail = q.includes("@");
  const baseFilter = {
    isActive: true,
    isSuspended: false,
    roles: { $in: ["agent"] },
    agentListId: { $ne: null },
  };

  const query = isEmail
    ? { ...baseFilter, email: { $regex: `^${normalizeEmail(q)}$`, $options: "i" } }
    : {
        ...baseFilter,
        fullName: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
      };

  const row = await StaffAccount.findOne(query)
    .select("_id email fullName agentListId isActive isSuspended roles")
    .lean();

  if (!row) return null;

  return {
    staffId: row._id,
    agentListId: row.agentListId,
    fullName: row.fullName || null,
    email: row.email,
  };
};
