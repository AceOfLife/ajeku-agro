const router = require('express').Router();
const verificationCtrl = require('../controllers/verification.controller');

// ===============================================================
// PUBLIC ROUTES — must be BEFORE any router.use('/')
// ===============================================================

router.get('/verify/:token', verificationCtrl.publicGetForm);
router.post('/verify/:token', verificationCtrl.publicSubmitForm);

router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'Affiliate API is running' })
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