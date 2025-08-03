const axios = require('axios');

const verifyCaptcha = async (req, res, next) => {
    try {
        const token = req.body['g-recaptcha-token'];
        if(!token) {
            return res.status(400).json({ message: 'Missing CAPTCHA token' });
        }

        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify`,
            null,
            {
                params: {
                    secret: secretKey,
                    response: token,
                    remoteip: req.ip,
                },
            }
        );
        
        const data = response.data;
        if(!data.success || data.score < 0.5) {
            return res.status(403).json({ message: 'CAPTCHA verification failed' });
        }
        next(); // CAPTCHA passed, proceed to the actual route handler

    } catch (err) {
        console.log(`CAPTCHA Error: ${err.message}`);
        res.status(500).json({ message: 'CAPTCHA verification error' });
    };
};

module.exports = verifyCaptcha;