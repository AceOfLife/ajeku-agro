// routes/farmUnitRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const FarmUnitController = require('../controllers/FarmUnitController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const { upload } = require('../config/multerConfig');  // ← Import upload

router.get('/', authenticate, FarmUnitController.getUnits);
router.get('/available', authenticate, FarmUnitController.getAvailableUnits);
router.get('/:unitId', authenticate, FarmUnitController.getUnit);
router.post('/', authenticate, authorizeAdmin, upload, FarmUnitController.createUnits);  // ← Added upload middleware
router.put('/:unitId', authenticate, authorizeAdmin, FarmUnitController.updateUnit);
router.delete('/:unitId', authenticate, authorizeAdmin, FarmUnitController.deleteUnit);
router.post('/:unitId/purchase', authenticate, FarmUnitController.purchaseUnit);

module.exports = router;