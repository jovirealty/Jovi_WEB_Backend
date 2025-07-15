const indexForm = require('../models/IndexFormSchema');
const sellingInquiry = require('../models/SellingInquiryFormSchema');
const BuyRentInquiry = require('../models/BuyRentInquiryFormSchema');

exports.submitIndexForm = async (req, res, next) => {
    try {
        const data = await indexForm.create(req.body);
        console.log("data: ", data);
        res.status(201).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

exports.submitSellingInquiryForm = async (req, res, next) => {
    try {
        const data = await sellingInquiry.create(req.body);
        console.log("data: ", data);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}
exports.submitBuyRentInquiryForm = async (req, res, next) => {
    try {
        const data = await BuyRentInquiry.create(req.body);
        console.log("buy rent data: ", data);
        res.status(201).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}