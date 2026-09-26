const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createRules,
  updateRules,
  idRule,
  listRules,
} = require('../validators/payment.validator');

router.use(authenticate);

// Affiliate reads own
router.get('/', authorize('affiliate'), listRules, validate, ctrl.listMyPayments);
router.get('/:id', authorize('affiliate'), idRule, validate, ctrl.getMyPayment);

module.exports = router;