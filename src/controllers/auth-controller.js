const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma = require("../config/prisma");
const { signToken } = require("../middleware/auth");
const { sendMail } = require("../config/mailer");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require("../utils/validators-auth");

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// In-memory reset/verification token store.
// In production, persist these as DB rows with expiry instead.
const resetTokens = new Map();
const verifyTokens = new Map();

async function register(req, res) {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const hashed = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, password: hashed, role: "CUSTOMER" },
  });

  const verifyToken = crypto.randomBytes(24).toString("hex");
  verifyTokens.set(verifyToken, user.id);
  await sendMail({
    to: user.email,
    subject: "Verify your H&S Watches account",
    html: `<p>Welcome to H&S Watches. Verify your email: <a href="${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}">Verify Email</a></p>`,
  });

  const token = signToken(user);
  res.cookie("token", token, COOKIE_OPTS);
  res.status(201).json({ user: sanitizeUser(user), token });
}

async function login(req, res) {
  const data = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user || !user.password) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  if (user.blocked) {
    return res.status(403).json({ error: "This account has been suspended" });
  }

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  const token = signToken(user);
  res.cookie("token", token, COOKIE_OPTS);
  res.json({ user: sanitizeUser(user), token });
}

async function logout(req, res) {
  res.clearCookie("token");
  res.json({ success: true });
}

async function me(req, res) {
  res.json({ user: sanitizeUser(req.user) });
}

async function forgotPassword(req, res) {
  const data = forgotPasswordSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  // Always respond success to avoid leaking which emails are registered
  if (user) {
    const token = crypto.randomBytes(24).toString("hex");
    resetTokens.set(token, { userId: user.id, expires: Date.now() + 3600_000 });
    await sendMail({
      to: user.email,
      subject: "Reset your H&S Watches password",
      html: `<p>Reset your password: <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}">Reset Password</a></p>`,
    });
  }
  res.json({ success: true, message: "If that email exists, a reset link has been sent." });
}

async function resetPassword(req, res) {
  const data = resetPasswordSchema.parse(req.body);
  const entry = resetTokens.get(data.token);

  if (!entry || entry.expires < Date.now()) {
    return res.status(400).json({ error: "Reset link is invalid or has expired" });
  }

  const hashed = await bcrypt.hash(data.password, 10);
  await prisma.user.update({ where: { id: entry.userId }, data: { password: hashed } });
  resetTokens.delete(data.token);

  res.json({ success: true, message: "Password reset successfully" });
}

async function verifyEmail(req, res) {
  const { token } = req.body;
  const userId = verifyTokens.get(token);
  if (!userId) return res.status(400).json({ error: "Verification link is invalid or expired" });

  await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
  verifyTokens.delete(token);
  res.json({ success: true, message: "Email verified successfully" });
}

async function changePassword(req, res) {
  const data = changePasswordSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  const valid = await bcrypt.compare(data.currentPassword, user.password);
  if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

  const hashed = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  res.json({ success: true, message: "Password changed successfully" });
}

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

module.exports = {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  verifyEmail,
  changePassword,
};
