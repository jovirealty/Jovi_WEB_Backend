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

const JoinJoviFormSchema = new mongoose.Schema({
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
    licenceStatus: {
        type: String,
        required: true,
        enum: ["Yes", "No", "In Progress"],
    },
    message: {
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model("JoinJoviForm", JoinJoviFormSchema)