const express = require('express');
const router = express.Router();
const AgentController = require('../controllers/AgentListController');
const verifyCaptcha = require('../middlewares/verifyCaptcha');

// Webhook routes
router.post('/agents/sync', AgentController.upsertAgents);

// GET agent Routes
router.get('/agents',verifyCaptcha, AgentController.getAgents);
router.get('/agents/:id',verifyCaptcha, AgentController.getAgentById);

module.exports = router;