const express = require('express');
const router = express.Router();
const FarmController = require('../controllers/FarmController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const { upload } = require('../config/multerConfig');

// Public routes (or authenticated)
router.get('/', authenticate, FarmController.getAllFarms);
router.get('/filter', authenticate, FarmController.getFilteredFarms);
router.get('/recent', FarmController.getRecentFarms);
router.get('/most-viewed', FarmController.getMostViewedFarms);
router.get('/assemblage', FarmController.getAssemblage);
router.get('/relisted', FarmController.getRelistedFarms);
router.get('/:farm_id/units', authenticate, FarmController.getFarmUnits);

// Admin only routes
router.post('/', authenticate, authorizeAdmin, upload, FarmController.createFarm);
router.put('/:id', authenticate, authorizeAdmin, FarmController.updateFarm);
router.delete('/:id', authenticate, authorizeAdmin, FarmController.deleteFarm);
router.post('/:id/monthly-expense', authenticate, authorizeAdmin, FarmController.updateMonthlyExpense);
router.put('/:id/valuation', authenticate, authorizeAdmin, FarmController.updateFarmValuation);

// User farm routes
router.get('/user/my-farms', authenticate, FarmController.getUserFarms);
router.get('/:id', FarmController.getFarmById);

// Analytics routes
router.get('/analytics/:farmId', authenticate, FarmController.getFarmAnalytics);
router.get('/analytics/top-performing', authenticate, FarmController.getTopPerformingFarm);
router.get('/users/:userId/analytics', authenticate, FarmController.getUserFarmsAnalytics);

module.exports = router;