const { body, param } = require('express-validator');

const createRules = [
  body('name').isString().trim().notEmpty().withMessage('Name required'),
  body('description').optional().isString().trim(),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
  body('commissionPercent')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Commission percent must be 0–100'),
];

const updateRules = [
  param('id').isUUID(),
  body('name').optional().isString().trim().notEmpty(),
  body('description').optional().isString().trim(),
  body('price').optional().isFloat({ gt: 0 }),
  body('commissionPercent').optional().isFloat({ min: 0, max: 100 }),
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

module.exports = { createRules, updateRules, stockRules, idRule };