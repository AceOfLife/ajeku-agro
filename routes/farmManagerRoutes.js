const express = require('express');
const router = express.Router();
const FarmManagerController = require('../controllers/FarmManagerController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');

// Public routes (authenticated users can view farm managers)
router.get('/', authenticate, FarmManagerController.getAllFarmManagers);

// Admin only routes
router.post('/', authenticate, authorizeAdmin, FarmManagerController.createFarmManager);
router.put('/:id', authenticate, authorizeAdmin, FarmManagerController.updateFarmManager);
router.delete('/:id', authenticate, authorizeAdmin, FarmManagerController.deleteFarmManager);

module.exports = router;