const express = require('express');
const router = express.Router();
const { Investor } = require('../models');
const InvestorController = require('../controllers/InvestorController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const { upload } = require('../config/multerConfig');
const FarmController = require('../controllers/FarmController');
const NotificationController = require('../controllers/NotificationController');
const RelistController = require('../controllers/RelistController');

router.post('/register', InvestorController.createInvestor);
router.put('/profile', authenticate, upload, InvestorController.updateInvestorProfile);
router.put('/:id/status', authenticate, authorizeAdmin, InvestorController.updateInvestorStatus);

router.get('/profile', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'investor') {
      return res.status(403).json({ message: 'For investors only' });
    }

    const investorId = req.user.investorId || (await Investor.findOne({ 
      where: { user_id: req.user.id },
      attributes: ['id']
    }))?.id;

    if (!investorId) {
      return res.status(404).json({ message: 'Investor profile not found' });
    }

    req.params = { id: investorId };
    return InvestorController.getInvestor(req, res);
  } catch (error) {
    console.error('Profile route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/change-password', authenticate, InvestorController.changeInvestorPassword);

// Farm routes
router.get('/farms/recent', FarmController.getRecentFarms);
router.get('/farms/most-viewed', FarmController.getMostViewedFarms);
router.get('/farms/user', authenticate, FarmController.getUserFarms);
router.get('/farm-analytics/:farmId', authenticate, FarmController.getFarmAnalytics);
router.get('/analytics/top-performing', authenticate, FarmController.getTopPerformingFarm);
router.get('/users/:userId/analytics', authenticate, FarmController.getUserFarmsAnalytics);
router.get('/assemblage', FarmController.getAssemblage);
router.get('/farms/relisted', FarmController.getRelistedFarms);

// Notification routes
router.post('/notifications', authenticate, NotificationController.createNotification);
router.get('/notifications', authenticate, NotificationController.getUserNotifications);
router.put('/notifications/:id/read', authenticate, NotificationController.markAsRead);

// Relist routes
router.get('/farms/:farmId/can-relist', authenticate, RelistController.checkRelistEligibility);
router.post('/farms/:farmId/relist', authenticate, RelistController.relistFarm);
router.post('/farms/:farmId/relist-units', authenticate, RelistController.relistFarmUnits);
router.get('/farms/:farmId/relisted-units', RelistController.getRelistedFarmUnits);

module.exports = router;