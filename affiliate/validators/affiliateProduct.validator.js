const { body, param } = require('express-validator');

const assignRules = [
  param('affiliateId').isUUID(),
  body('productId').isUUID(),
  body('commissionPercent')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Commission percent must be 0–100'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be >= 0'),
];

const updateRules = [
  param('id').isUUID(),
  body('commissionPercent').optional().isFloat({ min: 0, max: 100 }),
  body('quantity').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
];

const stockRules = [
  param('id').isUUID(),
  body('quantity').optional().isInt({ min: 0 }),
  body('adjustment').optional().isInt(),
  body().custom((v) => {
    if (v.quantity === undefined && v.adjustment === undefined) {
      throw new Error('Provide either quantity or adjustment');
    }
    return true;
  }),
];

const idRule = [param('id').isUUID()];
const listRules = [param('affiliateId').isUUID()];

module.exports = { assignRules, updateRules, stockRules, idRule, listRules };