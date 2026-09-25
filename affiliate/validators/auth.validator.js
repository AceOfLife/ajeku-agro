const { body } = require('express-validator');

const signupRules = [
  body('name').isString().trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isString().isLength({ min: 6 }).withMessage('Password min 6 chars'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isString().isLength({ min: 6 }).withMessage('Password min 6 chars'),
];

const updateMeRules = [
  body('name').optional().isString().trim().notEmpty(),
  body('email').optional().isEmail(),
];

const changePasswordRules = [
  body('currentPassword').isString().isLength({ min: 6 }),
  body('newPassword').isString().isLength({ min: 6 }),
];

const createAffiliateRules = signupRules;
const createWorkerRules = signupRules;

module.exports = {
  signupRules,
  loginRules,
  updateMeRules,
  changePasswordRules,
  createAffiliateRules,
  createWorkerRules,
};