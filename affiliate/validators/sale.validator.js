const { body, param, query } = require('express-validator');

const createRules = [
  body('productId').isUUID().withMessage('Valid product id required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be >= 1'),
];

const statusRules = [
  param('id').isUUID(),
  body('status')
    .isIn(['completed', 'refunded'])
    .withMessage('Status must be completed or refunded'),
];

const idRule = [param('id').isUUID()];

const listRules = [
  query('status').optional().isIn(['pending', 'completed', 'refunded']),
  query('productId').optional().isUUID(),
  query('affiliateId').optional().isUUID(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { createRules, statusRules, idRule, listRules };