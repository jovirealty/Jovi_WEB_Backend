const jwt = require("jsonwebtoken");
const StaffAccount = require("../../../models/staff/StaffAccountSchema");

module.exports = async function authRequired(req, res, next) {
    const h = req.headers.authorization || '';
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if(!token) {
        return res.status(401).json({error: "Unauthorized"});
    }
    try {
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const user = await StaffAccount.findById(payload.sub).lean();
        if(!user || !user.isActive || user.isSuspended) {
            return res.status(403).json({error: "Forbidden"});
        }
        req.user = user;
        next();
    } catch (e) {
        return res.status(401).json({ error: "Invalid token" });
    }
};