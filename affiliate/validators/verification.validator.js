const { body, param, query } = require('express-validator');

// POST /api/affiliate/verify/:token  (public — buyer submits form)
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

// GET /api/affiliate/verify/:token  (public)
const tokenRule = [param('token').isUUID().withMessage('Invalid verification token')];

// GET /api/affiliate/admin/affiliates/:id/qr  + POST same path
const affiliateIdRule = [param('id').isUUID().withMessage('Invalid affiliate id')];

// Admin listing of verifications: filters + pagination
const listRules = [
  query('affiliateId').optional().isUUID(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { submitRules, tokenRule, affiliateIdRule, listRules };