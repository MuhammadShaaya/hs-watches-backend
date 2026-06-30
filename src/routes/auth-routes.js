const express = require("express");
const passport = require("passport");
const asyncHandler = require("../utils/async-handler");
const { requireAuth, signToken } = require("../middleware/auth");
const ctrl = require("../controllers/auth-controller");

const router = express.Router();

router.post("/register", asyncHandler(ctrl.register));
router.post("/login", asyncHandler(ctrl.login));
router.post("/logout", asyncHandler(ctrl.logout));
router.get("/me", requireAuth, asyncHandler(ctrl.me));
router.post("/forgot-password", asyncHandler(ctrl.forgotPassword));
router.post("/reset-password", asyncHandler(ctrl.resetPassword));
router.post("/verify-email", asyncHandler(ctrl.verifyEmail));
router.post("/change-password", requireAuth, asyncHandler(ctrl.changePassword));

// Google OAuth — requires passport-google-oauth20 strategy configured in src/config/passport.js
router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: "Google OAuth is not configured on this server yet." });
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});
router.get(
  "/google/callback",
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ error: "Google OAuth is not configured on this server yet." });
    }
    next();
  },
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    const token = signToken(req.user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(`${process.env.FRONTEND_URL}/account`);
  }
);

module.exports = router;
