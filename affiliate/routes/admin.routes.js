const router = require('express').Router();
const ctrl = require('../controllers/affiliate.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createAffiliateRules } = require('../validators/auth.validator');

router.use(authenticate, authorize('admin'));

router.post('/affiliates', createAffiliateRules, validate, ctrl.createAffiliate);
router.get('/affiliates', ctrl.listAffiliates);

module.exports = router;