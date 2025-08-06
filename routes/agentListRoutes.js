const express = require('express');
const router = express.Router();
const AgentController = require('../controllers/AgentListController');
// const verifyCaptcha = require('../middlewares/verifyCaptcha');

// Webhook routes
router.post('/agents/sync', AgentController.upsertAgents);

// GET agent Routes
router.get('/agents', AgentController.searchAgents)
// router.get('/agents', AgentController.getAgents);
router.get('/agents/:id', AgentController.getAgentById);

module.exports = router;