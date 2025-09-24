const mongoose = require('mongoose');
const { getMainConn } = require('../config/db');

const AgentListingSchema = new mongoose.Schema({
    fullName: { type: String },
    mlsId: { type: String },
    aboutUs: { type: String },
    licenseNumber: {type: String},
    knownAs: { type: String },
    licensedAs: { type: String },
    licensedFor: { type: String },
    personalRecCorpName: { type: String },
    phoneNumber: { type: String },
    secondaryPhone: { type: String },
    email: { type: String, trim: true },
    joviEmail: { type: String, trim: true },
    teamName: { type: String },
    photoUrl: { type: String },
    officePhone: { type: String },
}, { timestamps: true, collection: 'agentlists' });

const jovi = getMainConn();
module.exports = jovi.models.AgentList || jovi.model('AgentList', AgentListingSchema, 'agentlists');