const express = require('express');
const router = express.Router();
const AgentController = require('../../controllers/AgentListController');
const { getAllProperty } = require('../../controllers/StaffAddPropertyControllers/webapp/AgentPropertyListingsController');
// const verifyCaptcha = require('../middlewares/verifyCaptcha');

// Webhook routes
router.post('/agents/sync', AgentController.upsertAgents);

// Off-Market listings (agentProperties)
router.get('/agents/propertylistings', getAllProperty);
// router.get('/agent/propertylistings/:id', getPropertyById);

// GET agent Routes
router.get('/agents', AgentController.searchAgents)
// router.get('/agents', AgentController.getAgents);
router.get('/agents/:id', AgentController.getAgentById);

module.exports = router;