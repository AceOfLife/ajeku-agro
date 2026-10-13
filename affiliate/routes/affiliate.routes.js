const router = require('express').Router();
const ctrl = require('../controllers/affiliate.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createWorkerRules } = require('../validators/auth.validator');

router.use(authenticate, authorize('affiliate'));

// Workers
router.post('/workers', createWorkerRules, validate, ctrl.createWorker);
router.get('/workers', ctrl.listWorkers);
router.patch('/workers/:id/toggle', ctrl.toggleWorker);
router.delete('/workers/:id', ctrl.deleteWorker);

module.exports = router;