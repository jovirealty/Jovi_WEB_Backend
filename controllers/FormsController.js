const indexForm = require('../models/indexFormSchema');

exports.submitIndexForm = async (req, res, next) => {
    try {
        const data = await indexForm.create(req.body);
        console.log("data: ", data);
        res.status(201).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};