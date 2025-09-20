module.exports = function requireSuperadmin(req, res, next) {
    const roles = req.user?.roles || [];
    if(!roles.includes('superadmin')) {
        return res.status(403).json({ error: 'Forbidden: Superadmin access required' });
    }
    next();
};