const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { fail } = require('../utils/response');

const SECRET = process.env.AFFILIATE_JWT_SECRET || 'affiliate-dev-secret';

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return fail(res, 'Authentication required', 401);

    const payload = jwt.verify(token, SECRET);
    const user = await User.findByPk(payload.sub);
    if (!user || !user.isActive) return fail(res, 'Account inactive or not found', 401);

    req.user = user;
    next();
  } catch (err) {
    return fail(res, 'Invalid or expired token', 401);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return fail(res, 'Authentication required', 401);
  if (roles.length && !roles.includes(req.user.role)) {
    return fail(res, 'Forbidden', 403);
  }
  next();
};

module.exports = { authenticate, authorize, SECRET };