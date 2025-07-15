const indexForm = require('../models/IndexFormSchema');
const sellingInquiry = require('../models/SellingInquiryFormSchema');
const BuyRentInquiry = require('../models/BuyRentInquiryFormSchema');
const RentalService = require('../models/RentalServiceFormSchema');
// const JoinJoviForm = require('../models/JoinJoviFormSchema');

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
};

exports.submitBuyRentInquiryForm = async (req, res, next) => {
    try {
        const data = await BuyRentInquiry.create(req.body);
        console.log("buy rent data: ", data);
        res.status(201).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

exports.submitRentalServiceInquiryForm = async (req, res, next) => {
    try {
        const data = await RentalService.create(req.body);
        console.log("Rental Service data: ", data);
        res.status(201).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

// exports.submitJoinJoviInquiryForm = async (req, res, next) => {
//     try {
//         const data = await JoinJoviForm.create(req.body);
//         console.log("join jovi data: ", data);
//         res.status(201).json({ sucess: true, data });
//     } catch (err) {
//         next(err);
//     }
// };