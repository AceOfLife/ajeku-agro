const router = require('express').Router();
const ctrl = require('../controllers/sale.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createRules,
  statusRules,
  idRule,
  listRules,
} = require('../validators/sale.validator');

router.use(authenticate);

// Anyone authenticated can list/view (scoped inside controller by role)
router.get('/', listRules, validate, ctrl.listSales);
router.get('/:id', idRule, validate, ctrl.getSale);

// Logging a sale: affiliate or worker only — never admin
router.post('/', authorize('affiliate', 'worker'), createRules, validate, ctrl.createSale);

// Status changes: affiliate or worker, own sales only (scoped inside controller)
router.patch(
  '/:id/status',
  authorize('affiliate', 'worker'),
  statusRules,
  validate,
  ctrl.updateStatus
);

module.exports = router;