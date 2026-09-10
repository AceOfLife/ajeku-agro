// routes/gisRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const GISService = require('../services/gisService');
const { Farm, FarmUnit, sequelize } = require('../models');

// ===== FARM ROUTES =====

// ✅ Get all farms with units as GeoJSON
router.get('/farms/complete', authenticate, async (req, res) => {
  try {
    const geoJSON = await GISService.getAllFarmsWithUnitsGeoJSON();
    res.status(200).json({
      success: true,
      data: geoJSON
    });
  } catch (error) {
    console.error('Error fetching complete farm data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch farm data',
      error: error.message
    });
  }
});

// ✅ Get specific farm with all units
router.get('/farms/:farmId/complete', authenticate, async (req, res) => {
  try {
    const farmData = await GISService.getCompleteFarmData(req.params.farmId);
    if (!farmData) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }
    res.status(200).json({
      success: true,
      data: farmData
    });
  } catch (error) {
    console.error('Error fetching farm data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch farm data',
      error: error.message
    });
  }
});

// ✅ Get farms with NDVI summary
router.get('/ndvi/summary', authenticate, async (req, res) => {
  try {
    const data = await GISService.getFarmsWithNDVISummary();
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching NDVI summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch NDVI summary',
      error: error.message
    });
  }
});

// ✅ Get NDVI for a specific unit
router.get('/units/:unitId/ndvi', authenticate, async (req, res) => {
  try {
    const ndviData = await GISService.getUnitNDVI(req.params.unitId);
    if (!ndviData) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }
    res.status(200).json({
      success: true,
      data: ndviData
    });
  } catch (error) {
    console.error('Error fetching NDVI data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch NDVI data',
      error: error.message
    });
  }
});

// ✅ Update NDVI for a unit (admin only)
router.post('/units/:unitId/ndvi', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { ndvi_value, satellite_image_url } = req.body;
    
    if (ndvi_value === undefined || ndvi_value < 0 || ndvi_value > 1) {
      return res.status(400).json({
        success: false,
        message: 'ndvi_value must be between 0 and 1'
      });
    }

    const result = await GISService.updateUnitNDVI(
      req.params.unitId,
      parseFloat(ndvi_value),
      satellite_image_url
    );

    res.status(200).json({
      success: true,
      message: 'NDVI updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating NDVI:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update NDVI',
      error: error.message
    });
  }
});

// ✅ Update unit geometry (admin only)
router.put('/units/:unitId/geometry', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { latitude, longitude, boundary } = req.body;
    
    const unit = await FarmUnit.findByPk(req.params.unitId);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    const updateData = {};
    if (latitude && longitude) {
      updateData.latitude = latitude;
      updateData.longitude = longitude;
      updateData.geometry = sequelize.fn(
        'ST_SetSRID',
        sequelize.fn('ST_MakePoint', longitude, latitude),
        4326
      );
    }
    if (boundary) {
      updateData.boundary = sequelize.fn(
        'ST_SetSRID',
        sequelize.fn('ST_GeomFromGeoJSON', JSON.stringify(boundary)),
        4326
      );
    }

    await unit.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Unit geometry updated',
      data: unit
    });
  } catch (error) {
    console.error('Error updating unit geometry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update unit geometry',
      error: error.message
    });
  }
});

module.exports = router;