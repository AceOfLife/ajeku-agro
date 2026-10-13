const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const verificationCtrl = require('../controllers/verification.controller');

// ---- Feature routers ----
router.use('/auth', require('./auth.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/affiliates', require('./affiliate.routes'));
router.use('/products', require('./product.routes'));
router.use('/sales', require('./sale.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/dashboard', require('./dashboard.routes'));

// Affiliate-product assignments (assign, list, stock, deactivate)
// Mounted at root — its internal paths are:
//   GET    /my-products
//   POST   /admin/affiliates/:affiliateId/products
//   GET    /admin/affiliates/:affiliateId/products
//   GET    /affiliate-products/:id
//   PATCH  /affiliate-products/:id
//   PATCH  /affiliate-products/:id/stock
//   DELETE /affiliate-products/:id
router.use('/', require('./affiliateProduct.routes'));

// ---- Public buyer verification (no auth) ----
// Buyer scans affiliate QR → lands here.
router.get('/verify/:token', verificationCtrl.publicGetForm);
router.post('/verify/:token', verificationCtrl.publicSubmitForm);

// ---- QR fetch (affiliate + worker) ----
// Used by the POS after a sale to display the affiliate's QR.
router.get(
  '/my-qr',
  authenticate,
  authorize('affiliate', 'worker'),
  verificationCtrl.getMyQr
);

// ---- Health ----
router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'Affiliate API is running' })
);

module.exports = router;