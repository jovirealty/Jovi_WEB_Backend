const mongoose = require('mongoose');

const propertyDetailSchema = new mongoose.Schema({
    link: {
        type: String,
        required: true,
    },
    completeAddress: {
        type: String,
        required: true,
    },
}, { _id: false });

const contactDetailSchema = new mongoose.Schema({
    countryCode: {
        type: String,
        required: true,
    },
    contactNumber: {
        type: String,
        required: true,
    }
}, { _id: false });

const BuyRentInquiryFormSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    emailAddress: {
        type: String,
        required: true,
    },
    contactDetail: {
        type: contactDetailSchema,
        required: true,
    },
    propertyType: {
        type: String,
        required: true,
    },
    propertyDetail: {
        type: propertyDetailSchema,
        required: true
    },
    message: {
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model("BuyRentInquiry", BuyRentInquiryFormSchema);