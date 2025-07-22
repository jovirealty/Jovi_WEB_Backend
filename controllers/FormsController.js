const IndexForm = require('../models/indexFormSchema.js');
const SellingInquiry = require('../models/SellingInquiryFormSchema.js');
const BuyRentInquiry = require('../models/BuyRentInquiryFormSchema.js');
const RentalService = require('../models/RentalServiceFormSchema.js');
const JoinJoviForm = require('../models/JoinJoviFormSchema.js');
const ContactForm = require('../models/ContactFormSchema.js');

exports.submitIndexForm = async (req, res, next) => {
    try {
        const data = await IndexForm.create(req.body);
        console.log("data: ", data);
        res.status(201).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

exports.submitSellingInquiryForm = async (req, res, next) => {
    try {
        const data = await SellingInquiry.create(req.body);
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

exports.submitJoinJoviInquiryForm = async (req, res, next) => {
    try {
        const data = await JoinJoviForm.create(req.body);
        console.log("join jovi data: ", data);
        res.status(201).json({ sucess: true, data });
    } catch (err) {
        next(err);
    }
};

exports.submitContactForm = async (req, res, next) => {
    try {
        const data = await ContactForm.create(req.body);
        console.log("contact form data", data);
        res.status(201).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};