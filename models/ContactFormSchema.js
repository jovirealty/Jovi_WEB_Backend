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

const ContactFormSchema = new mongoose.Schema({
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
    message: { 
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model("ContactForm", ContactFormSchema);