const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { submitRules } = require('../validators/verification.validator');
const verificationCtrl = require('../controllers/verification.controller');

// ===============================================================
// PUBLIC / SPECIFIC ROUTES — must be BEFORE any router.use('/')
// ===============================================================

// Public buyer verification (no auth)
router.get('/verify/:token', verificationCtrl.publicGetForm);
router.post('/verify/:token', submitRules, validate, verificationCtrl.publicSubmitForm);

// Health (no auth)
router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'Affiliate API is running' })
);

// ===============================================================
// AUTH-REQUIRED ROUTES
// ===============================================================

// QR fetch (affiliate + worker) — POS uses this after a sale
router.get(
  '/my-qr',
  authenticate,
  authorize('affiliate', 'worker'),
  verificationCtrl.getMyQr
);

// ===============================================================
// FEATURE ROUTERS
// ===============================================================

router.use('/auth', require('./auth.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/affiliates', require('./affiliate.routes'));
router.use('/products', require('./product.routes'));
router.use('/sales', require('./sale.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/dashboard', require('./dashboard.routes'));

// Affiliate-product assignments — catch-all, declared last
router.use('/', require('./affiliateProduct.routes'));

module.exports = router;