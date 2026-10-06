const router = require('express').Router();
const ctrl = require('../controllers/affiliateProduct.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  assignRules,
  updateRules,
  stockRules,
  idRule,
  listRules,
} = require('../validators/affiliateProduct.validator');

router.use(authenticate);

// Affiliate: own assigned products
router.get('/my-products', authorize('affiliate'), ctrl.listMyProducts);

// Admin or owning affiliate: view one assignment
router.get('/affiliate-products/:id', idRule, validate, ctrl.getOne);

// Admin: assign / update / stock / remove
router.post(
  '/admin/affiliates/:affiliateId/products',
  authorize('admin'),
  assignRules,
  validate,
  ctrl.assignProduct
);
router.get(
  '/admin/affiliates/:affiliateId/products',
  authorize('admin'),
  listRules,
  validate,
  ctrl.listByAffiliate
);
router.patch(
  '/affiliate-products/:id',
  authorize('admin'),
  updateRules,
  validate,
  ctrl.update
);
router.patch(
  '/affiliate-products/:id/stock',
  authorize('admin'),
  stockRules,
  validate,
  ctrl.adjustStock
);
router.delete(
  '/affiliate-products/:id',
  authorize('admin'),
  idRule,
  validate,
  ctrl.remove
);

module.exports = router;