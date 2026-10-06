const { body, param } = require('express-validator');

const createRules = [
  body('name').isString().trim().notEmpty().withMessage('Name required'),
  body('description').optional().isString().trim(),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
];

const updateRules = [
  param('id').isUUID(),
  body('name').optional().isString().trim().notEmpty(),
  body('description').optional().isString().trim(),
  body('price').optional().isFloat({ gt: 0 }),
  body('isActive').optional().isBoolean(),
];

const idRule = [param('id').isUUID()];

module.exports = { createRules, updateRules, idRule };