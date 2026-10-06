const router = require('express').Router();

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

router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'Affiliate API is running' })
);

module.exports = router;