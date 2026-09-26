const router = require('express').Router();
const { param } = require('express-validator');
const ctrl = require('../controllers/affiliate.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createAffiliateRules } = require('../validators/auth.validator');
const paymentCtrl = require('../controllers/payment.controller');
const {
  createRules: paymentCreateRules,
  updateRules: paymentUpdateRules,
  idRule: paymentIdRule,
  listRules: paymentListRules,
} = require('../validators/payment.validator');

router.use(authenticate, authorize('admin'));

router.post('/affiliates', createAffiliateRules, validate, ctrl.createAffiliate);
router.get('/affiliates', ctrl.listAffiliates);
router.get(
  '/affiliates/:id/balance',
  [param('id').isUUID()],
  validate,
  ctrl.getAffiliateBalance
);

router.post('/payments', paymentCreateRules, validate, paymentCtrl.adminCreatePayment);
router.get('/payments', paymentListRules, validate, paymentCtrl.adminListPayments);
router.get('/payments/:id', paymentIdRule, validate, paymentCtrl.adminGetPayment);
router.patch('/payments/:id', paymentUpdateRules, validate, paymentCtrl.adminUpdatePayment);
router.delete('/payments/:id', paymentIdRule, validate, paymentCtrl.adminDeletePayment);
router.post('/payments/:id/restore', paymentIdRule, validate, paymentCtrl.adminRestorePayment);

module.exports = router;