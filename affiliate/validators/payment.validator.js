const { body, param, query } = require('express-validator');

const createRules = [
  body('affiliateId').isUUID().withMessage('Valid affiliate id required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be > 0'),
  body('paidOn').isISO8601().withMessage('Valid paidOn date required'),
  body('paymentMethod')
    .optional()
    .isIn(['bank_transfer', 'cash', 'cheque', 'other']),
  body('note').optional().isString().trim(),
  body('status').optional().isIn(['paid', 'pending']),
];

const updateRules = [
  param('id').isUUID(),
  body('amount').optional().isFloat({ gt: 0 }),
  body('paidOn').optional().isISO8601(),
  body('paymentMethod')
    .optional()
    .isIn(['bank_transfer', 'cash', 'cheque', 'other']),
  body('note').optional().isString().trim(),
  body('status').optional().isIn(['paid', 'pending']),
];

const idRule = [param('id').isUUID()];

const listRules = [
  query('affiliateId').optional().isUUID(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('includeDeleted').optional().isIn(['true', 'false']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { createRules, updateRules, idRule, listRules };