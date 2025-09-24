const express = require("express");
const router = express.Router();

const authRequired = require("../../middlewares/DashboardMiddlewares/auth/authRequired");
const requireSuperadmin = require("../../middlewares/DashboardMiddlewares/auth/requireSuperadmin");

const StaffAccountsController = require("../../controllers/DashboardControllers/StaffAccountsController");

// Staff Account
router.post('/staff/accounts/signup', authRequired, requireSuperadmin, StaffAccountsController.createStaffAccount); // CREATE
router.get('/staff/accounts', authRequired, requireSuperadmin, StaffAccountsController.listStaffAccounts);           // LIST
router.get('/staff/accounts/:id', authRequired, requireSuperadmin, StaffAccountsController.getStaffAccount);         // SHOW
router.get('/staff/agent-lookup/', authRequired, requireSuperadmin, StaffAccountsController.lookupAgentByEmail);     // LOOKUP AGENT BY EMAIL

module.exports = router;