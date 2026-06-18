const express = require('express');
const router = express.Router();
const FarmController = require('../controllers/FarmController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const { upload } = require('../config/multerConfig');

// ===== PUBLIC ROUTES (No Auth Required) - Static Only =====
router.get('/recent', FarmController.getRecentFarms);
router.get('/most-viewed', FarmController.getMostViewedFarms);
router.get('/assemblage', FarmController.getAssemblage);
router.get('/relisted', FarmController.getRelistedFarms);

// ===== AUTHENTICATED STATIC ROUTES =====
router.get('/', authenticate, FarmController.getAllFarms);
router.get('/filter', authenticate, FarmController.getFilteredFarms);
router.get('/user/my-farms', authenticate, FarmController.getUserFarms);

// ===== ANALYTICS - Static Route First =====
router.get('/analytics/top-performing', authenticate, FarmController.getTopPerformingFarm);

// ===== ADMIN ONLY ROUTES (With Parameters) =====
router.post('/', authenticate, authorizeAdmin, upload, FarmController.createFarm);
router.put('/:id', authenticate, authorizeAdmin, FarmController.updateFarm);
router.delete('/:id', authenticate, authorizeAdmin, FarmController.deleteFarm);
router.post('/:id/monthly-expense', authenticate, authorizeAdmin, FarmController.updateMonthlyExpense);
router.put('/:id/valuation', authenticate, authorizeAdmin, FarmController.updateFarmValuation);

// ===== PARAMETER ROUTES (ALL MUST BE AT THE BOTTOM) =====
router.get('/analytics/:farmId', authenticate, FarmController.getFarmAnalytics);
router.get('/users/:userId/analytics', authenticate, FarmController.getUserFarmsAnalytics);
router.get('/:farm_id/units', authenticate, FarmController.getFarmUnits);
router.get('/:id', FarmController.getFarmById);

module.exports = router;