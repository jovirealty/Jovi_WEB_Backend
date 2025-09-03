const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const crypto = require('crypto');

const StaffAccount = require('../../models/staff/StaffAccountSchema');
const Session = require('../../models/staff/SessionSchema');

const ACCESS_TTL_MIN = parseInt(process.env.ACCESS_TTL_MIN || '15', 10);
const REFRESH_TTL_DAYS = parseInt(process.env.REFRESH_TTL_DAYS || '30', 10);

function signAccess(user) {
    const payload = { sub: user._id.toString(), roles: user.roles };
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: `${ACCESS_TTL_MIN}m` });
}

function setRefreshCookie(res, token) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('rt', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "None" : "Lax",
        domain: process.env.COOKIE_DOMAIN || 'localhost',
        path: "/",
        maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    });
}

function hash(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

exports.login = async (req, res) => {
    const {email, password} = req.body || {};
    if(!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await StaffAccount.findOne({ email: email.toLowerCase() });
    if(!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    if(!user.roles?.includes('superadmin')) {
        return res.status(403).json({ error: 'superadmin access required' });
    }
    if(!user.isActive || user.isSuspended) {
        return res.status(403).json({ error: 'Account inactive or suspended' });
    }

    const ok = await argon2.verify(user.passwordHash, password);
    if(!ok) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Refresh Token
    const rawRt = crypto.randomBytes(64).toString('base64url');
    const rtHash = hash(rawRt);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
    await Session.create({
        userId: user._id,
        tokenHash: rtHash,
        userAgent: req.get("user-agent"),
        ip: req.ip,
        expiresAt,
    });

    setRefreshCookie(res, rawRt);
    const accessToken = signAccess(user);
    await StaffAccount.updateOne({ _id: user._id}, { $set: {lastLoginAt: new Date() } });

    return res.json({
        accessToken,
        user: {
            id: user._id,
            email: user.email,
            roles: user.roles,
            mustChangePassword: !!user.mustChangePassword,
        }
    });
};

exports.refresh = async (req, res) => {
    const raw = req.cookies?.rt;
    if(!raw) {
        return res.status(401).json({ error: 'No refresh token' });
    }
    const session = await Session.findOne({ tokenHash: hash(raw), revokedAt: null }).lean();
    if(!session) {
        return res.status(401).json({ error: "Invalid refresh" });
    }

    const user = await StaffAccount.findById(session.userId).lean();
    if(!user || !user.isActive || user.isSuspended) {
        return res.status(403).json({ error: "Account inactive or suspended" })
    }

    // rotate
    await Session.updateOne({ _id: session._id }, { $set: { revokedAt: new Date() } });
    const newRaw = crypto.randomBytes(64).toString("base64url");
    await Session.create({
        userId: user._id,
        tokenHash: hash(newRaw),
        userAgent: req.get("user-agent"),
        ip: req.ip,
        expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000),
    });
    setRefreshCookie(res, newRaw);
    return res.json({ accessToken: signAccess(user) });
};

exports.logout = async (req, res) => {
    const raw = req.cookies?.rt;
    if(raw) {
        await Session.updateOne({ tokenHash: hash(raw) }, { $set: { revokedAt: new Date() } });
    }
    res.clearCookie("rt", {
        domain: process.env.COOKIE_DOMAIN || 'localhost',
        path: "/",
    });
    return res.json({ ok: true });
};

exports.me = async (req, res) => {
    return res.json({
        id: req.user._id,
        email: req.user.email,
        roles: req.user.roles,
        isSuspended: req.user.isSuspended,
        mustChangePassword: !!req.user.mustChangePassword,
        passwordSetAt: req.user.passwordSetAt,
    });
};
