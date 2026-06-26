// routes/marketplaceRoutes.js
const express = require('express');
const router = express.Router();
const MarketplaceController = require('../controllers/MarketplaceController');
const { authenticate } = require('../middlewares/authMiddleware');

// Get all units across all farms (marketplace)
router.get('/units', authenticate, MarketplaceController.getAllUnits);
router.get('/units/stats', authenticate, MarketplaceController.getUnitStats);

module.exports = router;