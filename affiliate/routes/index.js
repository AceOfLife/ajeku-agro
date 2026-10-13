const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const verificationCtrl = require('../controllers/verification.controller');

// ===============================================================
// PUBLIC ROUTES — must be declared BEFORE any router.use('/') mount
// ===============================================================

// Public buyer verification (no auth)
router.get('/verify/:token', verificationCtrl.publicGetForm);
router.post('/verify/:token', verificationCtrl.publicSubmitForm);

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

// Affiliate-product assignments — mounted at root.
// Its internal routes:
//   GET    /my-products
//   POST   /admin/affiliates/:affiliateId/products
//   GET    /admin/affiliates/:affiliateId/products
//   GET    /affiliate-products/:id
//   PATCH  /affiliate-products/:id
//   PATCH  /affiliate-products/:id/stock
//   DELETE /affiliate-products/:id
router.use('/', require('./affiliateProduct.routes'));

// ===============================================================
// HEALTH
// ===============================================================

router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'Affiliate API is running' })
);

module.exports = router;