const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { ok, fail } = require('../utils/response');
const { SECRET } = require('../middleware/auth.middleware');

const EXPIRES = process.env.AFFILIATE_JWT_EXPIRES_IN || '7d';

const signToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role, affiliateId: user.parentAffiliateId || null },
    SECRET,
    { expiresIn: EXPIRES }
  );

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  affiliateId: u.parentAffiliateId,
  isActive: u.isActive,
  createdAt: u.createdAt,
});

// POST /api/affiliate/auth/admin-signup
exports.adminSignup = async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ where: { email: email.toLowerCase() } });
  if (exists) return fail(res, 'Email already in use', 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'admin',
    parentAffiliateId: null,
  });
  return ok(
    res,
    { token: signToken(admin), user: publicUser(admin) },
    'Admin account created',
    201
  );
};

// POST /api/affiliate/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) return fail(res, 'Invalid credentials', 401);
  if (!user.isActive) return fail(res, 'Account is inactive', 403);

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return fail(res, 'Invalid credentials', 401);

  return ok(res, { token: signToken(user), user: publicUser(user) }, 'Login successful');
};

// GET /api/affiliate/auth/me
exports.me = async (req, res) => ok(res, publicUser(req.user));

// PATCH /api/affiliate/auth/me
exports.updateMe = async (req, res) => {
  const { name, email } = req.body;
  const user = req.user;

  if (email && email.toLowerCase() !== user.email) {
    const exists = await User.findOne({ where: { email: email.toLowerCase() } });
    if (exists) return fail(res, 'Email already in use', 409);
    user.email = email.toLowerCase();
  }
  if (name) user.name = name;
  await user.save();
  return ok(res, publicUser(user), 'Profile updated');
};

// PATCH /api/affiliate/auth/me/password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user;
  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) return fail(res, 'Current password is incorrect', 400);

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  return ok(res, null, 'Password updated');
};