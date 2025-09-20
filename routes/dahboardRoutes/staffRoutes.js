const express = require("express");
const router = express.Router();
const authRequired = require("../../middlewares/DashboardMiddlewares/auth/authRequired");
const requireSuperadmin = require("../../middlewares/DashboardMiddlewares/auth/requireSuperadmin");
const StaffAccountsController = require("../../controllers/DashboardControllers/StaffAccountsController");

router.post('/staff/accounts/signup', authRequired, requireSuperadmin, StaffAccountsController.createStaffAccount);

module.exports = router;