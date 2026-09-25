const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/affiliates', require('./affiliate.routes'));
router.use('/products', require('./product.routes'));
router.use('/sales', require('./sale.routes'));   
router.use('/dashboard', require('./dashboard.routes'));

router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'Affiliate API is running' })
);

module.exports = router;