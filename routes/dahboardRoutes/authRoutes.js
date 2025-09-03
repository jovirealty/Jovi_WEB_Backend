const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const Auth = require("../../controllers/DashboardControllers/AuthController");
const authRequired = require("../../middlewares/DashboardMiddlewares/auth/authRequired");

const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 100 });

router.post("/login", limiter, Auth.login);
router.post("/logout", Auth.logout);
router.post("/refresh", limiter, Auth.refresh);
router.get("/me", authRequired, Auth.me);

module.exports = router;