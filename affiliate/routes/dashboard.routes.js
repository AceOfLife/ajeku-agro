const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const verificationCtrl = require('../controllers/verification.controller');
const { listRules: verificationListRules } = require('../validators/verification.validator');

// Dashboard is for affiliate + admin only. Workers are POS-only.
router.use(authenticate, authorize('affiliate', 'admin'));

router.get('/summary', ctrl.summary);
router.get('/by-product', ctrl.byProduct);
router.get('/timeline', ctrl.timeline);
router.get('/ledger', ctrl.ledger);
router.get('/payments', ctrl.payments);
router.get('/overview', ctrl.overview);

// Affiliate's own verification list (buyer scans on their QR)
router.get(
  '/verifications',
  verificationListRules,
  validate,
  verificationCtrl.listMyVerifications
);

module.exports = router;