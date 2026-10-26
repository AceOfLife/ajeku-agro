const { body, param, query } = require('express-validator');

// POST /api/affiliate/verify/:token  (public — first-time buyer submits form)
const submitRules = [
  param('token').isUUID().withMessage('Invalid verification token'),
  body('name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 120 })
    .withMessage('Name is too long'),
  body('email')
    .isEmail()
    .withMessage('Valid email required')
    .isLength({ max: 200 })
    .withMessage('Email is too long'),
];

// POST /api/affiliate/verify/:token  (public — repeat buyer skips the form)
const repeatRules = [
  param('token').isUUID().withMessage('Invalid verification token'),
  body('buyerToken').isUUID().withMessage('Valid buyerToken required'),
];

// GET /api/affiliate/verify/:token  (public)
const tokenRule = [param('token').isUUID().withMessage('Invalid verification token')];

// Admin listing of verifications: filters + pagination
const listRules = [
  query('affiliateId').optional().isUUID(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { submitRules, repeatRules, tokenRule, listRules };