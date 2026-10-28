const { body, param, query } = require('express-validator');

// POST /sales — body now has an array of items
const createRules = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('items must be a non-empty array'),

  body('items.*.affiliateProductId')
    .isUUID()
    .withMessage('Each item requires a valid affiliateProductId'),

  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item requires quantity >= 1'),
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
  query('affiliateProductId').optional().isUUID(),
  query('productId').optional().isUUID(),
  query('affiliateId').optional().isUUID(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { createRules, statusRules, idRule, listRules };