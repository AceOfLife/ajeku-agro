const express = require('express');
const router = express.Router();
const HarvestController = require('../controllers/HarvestController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');

// Get all harvest cycles for a farm
router.get('/farm/:farmId', authenticate, HarvestController.getHarvestCyclesByFarm);

// Get a specific harvest cycle
router.get('/:harvestCycleId', authenticate, HarvestController.getHarvestCycleById);

// Admin only routes
router.post('/', authenticate, authorizeAdmin, HarvestController.createHarvestCycle);
router.put('/:harvestCycleId', authenticate, authorizeAdmin, HarvestController.updateHarvestCycle);
router.put('/:harvestCycleId/record-harvest', authenticate, authorizeAdmin, HarvestController.recordHarvest);
router.post('/:harvestCycleId/allocate', authenticate, authorizeAdmin, HarvestController.allocateHarvest);
router.post('/:harvestCycleId/distribute', authenticate, authorizeAdmin, HarvestController.distributeHarvest);

// Harvest allocation routes
router.get('/:harvestCycleId/allocations', authenticate, HarvestController.getHarvestAllocations);
router.get('/:harvestCycleId/my-allocation', authenticate, HarvestController.getMyHarvestAllocation);
router.put('/allocations/:allocationId/payout', authenticate, authorizeAdmin, HarvestController.markPayoutComplete);
router.put('/allocations/:allocationId/delivery', authenticate, authorizeAdmin, HarvestController.updateDeliveryStatus);

module.exports = router;