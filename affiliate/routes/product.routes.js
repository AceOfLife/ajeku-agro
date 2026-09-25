const router = require('express').Router();
const ctrl = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { upload } = require('../config/upload');
const {
  createRules,
  updateRules,
  stockRules,
  idRule,
} = require('../validators/product.validator');

router.use(authenticate);

// Read endpoints — any authenticated role (POS needs the list)
router.get('/', ctrl.listProducts);
router.get('/:id', idRule, validate, ctrl.getProduct);

// Admin-only writes
router.post(
  '/',
  authorize('admin'),
  upload,
  createRules,
  validate,
  ctrl.createProduct
);

router.patch(
  '/:id',
  authorize('admin'),
  upload,
  updateRules,
  validate,
  ctrl.updateProduct
);

router.patch(
  '/:id/stock',
  authorize('admin'),
  stockRules,
  validate,
  ctrl.adjustStock
);

router.delete('/:id', authorize('admin'), idRule, validate, ctrl.deleteProduct);

module.exports = router;