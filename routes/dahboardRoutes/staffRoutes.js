const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer();

const authRequired = require("../../middlewares/DashboardMiddlewares/auth/authRequired");
const requireSuperadmin = require("../../middlewares/DashboardMiddlewares/auth/requireSuperadmin");

const staffLookupValidator = require("../../middlewares/DashboardMiddlewares/validation/StaffAddProperty/admin/staffLookup.validator");
const StaffLookupController = require("../../controllers/StaffAddPropertyControllers/admin/StaffLookupController");


const StaffAccountsController = require("../../controllers/DashboardControllers/StaffAccountsController");

// Staff Account
router.post('/staff/accounts/signup', authRequired, requireSuperadmin, StaffAccountsController.createStaffAccount); // CREATE
router.get('/staff/accounts',        authRequired, requireSuperadmin, StaffAccountsController.listStaffAccounts);   // LIST
router.get('/staff/accounts/:id',    authRequired, requireSuperadmin, StaffAccountsController.getStaffAccount);     // SHOW
router.get('/staff/agent-lookup/',   authRequired, requireSuperadmin, StaffAccountsController.lookupAgentByEmail);  // LOOKUP

// UPDATE (multipart, photo optional)
router.put(
  '/staff/accounts/:id/profile',
  authRequired,
  requireSuperadmin,
  upload.single('photo'),
  StaffAccountsController.updateAgentAndStaffProfile
);

module.exports = router;

// Add Property Route
router.get("/staff/check", (req, res) => res.json({ message: "Staff route is working" }));
router.get("/staff/staff-property-lookup", authRequired, staffLookupValidator, StaffLookupController.lookup);
