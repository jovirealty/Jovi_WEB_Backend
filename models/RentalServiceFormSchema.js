const mongoose = require('mongoose');

const contactDetailSchema = new mongoose.Schema({
    countryCode: {
        type: String,
        required: true,
    },
    contactNumber: {
        type: String,
        required: true,
    },
}, { _id: false });

const propertyDetailSchema = new mongoose.Schema({
    completeAddress: {
        type: String,
        required: true,
    }
}, { _id: false });

const RentalServiceFormSchema = new mongoose.Schema({
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
    propertyDetail: {
        type: propertyDetailSchema,
        required: true,
    },
    serviceRequested: [{
        type: String,
        required: true,
    }],
    message: {
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model("RentalService", RentalServiceFormSchema)