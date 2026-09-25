const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const {
  signupRules,
  loginRules,
  updateMeRules,
  changePasswordRules,
} = require('../validators/auth.validator');

router.post('/admin-signup', signupRules, validate, ctrl.adminSignup);
router.post('/login', loginRules, validate, ctrl.login);

router.get('/me', authenticate, ctrl.me);
router.patch('/me', authenticate, updateMeRules, validate, ctrl.updateMe);
router.patch(
  '/me/password',
  authenticate,
  changePasswordRules,
  validate,
  ctrl.changePassword
);

module.exports = router;