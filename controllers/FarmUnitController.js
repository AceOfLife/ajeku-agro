// controllers/FarmUnitController.js
const { FarmUnit, Farm, FarmUnitOwnership, User } = require('../models');
const { uploadImagesToCloudinary } = require('../config/multerConfig');
const { Op } = require('sequelize');

// controllers/FarmUnitController.js - createUnits (UPDATED)

exports.createUnits = async (req, res) => {
    try {
        const { farmId } = req.params;
        
        console.log('=== CREATE UNITS ===');
        console.log('req.body.units:', req.body.units);
        
        // Parse units from req.body
        let units = req.body.units;
        
        if (typeof units === 'string') {
            try {
                units = JSON.parse(units);
            } catch (e) {
                return res.status(400).json({ 
                    message: 'Invalid units format. Expected JSON array.' 
                });
            }
        }

        if (!units || !Array.isArray(units) || units.length === 0) {
            return res.status(400).json({ 
                message: 'Units array is required' 
            });
        }

        const farm = await Farm.findByPk(farmId);
        if (!farm) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        // Upload images to Cloudinary
        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = await uploadImagesToCloudinary(req.files);
            if (!Array.isArray(imageUrls)) {
                imageUrls = [imageUrls];
            }
        }

        console.log('Uploaded image URLs:', imageUrls);

        const createdUnits = [];

        for (let i = 0; i < units.length; i++) {
            const unitData = units[i];
            
            // Assign image URL if available
            let unitImageUrl = unitData.image_url || null;
            
            // If we have uploaded images, assign them to units in order
            if (imageUrls.length > 0) {
                // If there are multiple units, assign images sequentially
                // If more units than images, assign null to remaining
                if (i < imageUrls.length) {
                    unitImageUrl = imageUrls[i];
                } else {
                    unitImageUrl = null;  // No more images left
                }
            }

            const unit = await FarmUnit.create({
                farm_id: farmId,
                unit_number: unitData.unit_number,
                size_of_unit: unitData.size_of_unit,
                price: unitData.price,
                crop_type: unitData.crop_type,
                crop_description: unitData.crop_description || null,
                planting_date: unitData.planting_date || null,
                expected_harvest_date: unitData.expected_harvest_date || null,
                harvest_cycle_months: unitData.harvest_cycle_months || null,
                expected_yield_per_unit_kg: unitData.expected_yield_per_unit_kg || null,
                expected_value_per_kg: unitData.expected_value_per_kg || null,
                soil_type: unitData.soil_type || null,
                image_url: unitImageUrl,  // ← Now properly assigned
                gps_coordinates: unitData.gps_coordinates || null,
                irrigation_method: unitData.irrigation_method || null,
                physical_delivery_offered: unitData.physical_delivery_offered || false,
                isInstallment: unitData.isInstallment || false,
                is_fractional: unitData.is_fractional || true,
                isFractionalInstallment: unitData.isFractionalInstallment || false,
                isFractionalDuration: unitData.isFractionalDuration || null,
                duration: unitData.duration || null,
                percentage: unitData.percentage || null,
                monthly_expense: unitData.monthly_expense || null,
                status: 'available'
            });
            createdUnits.push(unit);
        }

        res.status(201).json({
            success: true,
            message: `${createdUnits.length} units created successfully`,
            units: createdUnits,
            images: imageUrls
        });
    } catch (error) {
        console.error('Error creating units:', error);
        res.status(500).json({ 
            message: 'Error creating units', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
};

exports.getUnits = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { status } = req.query;

    const farm = await Farm.findByPk(farmId);
    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    const where = { farm_id: farmId };
    if (status) {
      where.status = status;
    }

    const units = await FarmUnit.findAll({
      where,
      attributes: [
        'id', 'farm_id', 'unit_number', 'size_of_unit', 'price', 
        'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date',
        'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg',
        'soil_type', 'image_url', 'gps_coordinates', 'irrigation_method',
        'status', 'current_owner_id', 'nft_token_id', 'createdAt', 'updatedAt'
      ],
      include: [
        {
          model: User,
          as: 'currentOwner',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['unit_number', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: units.length,
      units
    });
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ message: 'Error fetching units', error });
  }
};

exports.getUnit = async (req, res) => {
  try {
    const { farmId, unitId } = req.params;

    const unit = await FarmUnit.findOne({
      where: { id: unitId, farm_id: farmId },
      attributes: [
        'id', 'farm_id', 'unit_number', 'size_of_unit', 'price', 
        'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date',
        'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg',
        'soil_type', 'image_url', 'gps_coordinates', 'irrigation_method',
        'status', 'current_owner_id', 'nft_token_id', 'createdAt', 'updatedAt'
      ],
      include: [
        {
          model: Farm,
          as: 'farm',
          attributes: ['id', 'name', 'location']
        },
        {
          model: User,
          as: 'currentOwner',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    res.status(200).json({
      success: true,
      unit
    });
  } catch (error) {
    console.error('Error fetching unit:', error);
    res.status(500).json({ message: 'Error fetching unit', error });
  }
};

exports.updateUnit = async (req, res) => {
  try {
    const { farmId, unitId } = req.params;
    const updateData = req.body;

    const unit = await FarmUnit.findOne({
      where: { id: unitId, farm_id: farmId }
    });

    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    await unit.update(updateData);

    const updatedUnit = await FarmUnit.findOne({
      where: { id: unitId, farm_id: farmId },
      attributes: [
        'id', 'farm_id', 'unit_number', 'size_of_unit', 'price', 
        'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date',
        'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg',
        'soil_type', 'image_url', 'gps_coordinates', 'irrigation_method',
        'status', 'current_owner_id', 'nft_token_id', 'createdAt', 'updatedAt'
      ],
      include: [
        {
          model: User,
          as: 'currentOwner',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Unit updated successfully',
      unit: updatedUnit
    });
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({ message: 'Error updating unit', error });
  }
};

exports.deleteUnit = async (req, res) => {
  try {
    const { farmId, unitId } = req.params;

    const unit = await FarmUnit.findOne({
      where: { id: unitId, farm_id: farmId }
    });

    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    if (unit.status === 'sold') {
      return res.status(400).json({ message: 'Cannot delete a sold unit' });
    }

    await unit.destroy();

    res.status(200).json({
      success: true,
      message: 'Unit deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({ message: 'Error deleting unit', error });
  }
};

exports.purchaseUnit = async (req, res) => {
  try {
    const { farmId, unitId } = req.params;
    const userId = req.user.id;

    const unit = await FarmUnit.findOne({
      where: { id: unitId, farm_id: farmId },
      attributes: [
        'id', 'farm_id', 'unit_number', 'size_of_unit', 'price', 
        'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date',
        'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg',
        'soil_type', 'image_url', 'gps_coordinates', 'irrigation_method',
        'status', 'current_owner_id', 'nft_token_id', 'createdAt', 'updatedAt'
      ]
    });

    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    if (unit.status !== 'available') {
      return res.status(400).json({ message: 'Unit is not available for purchase' });
    }

    const existingOwnership = await FarmUnitOwnership.findOne({
      where: {
        farm_unit_id: unitId,
        user_id: userId
      }
    });

    if (existingOwnership) {
      return res.status(400).json({ message: 'You already own this unit' });
    }

    const ownership = await FarmUnitOwnership.create({
      farm_unit_id: unitId,
      user_id: userId,
      units_purchased: 1,
      size_purchased: unit.size_of_unit,
      purchase_date: new Date()
    });

    await unit.update({
      status: 'sold',
      current_owner_id: userId
    });

    const updatedUnit = await FarmUnit.findOne({
      where: { id: unitId, farm_id: farmId },
      attributes: [
        'id', 'farm_id', 'unit_number', 'size_of_unit', 'price', 
        'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date',
        'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg',
        'soil_type', 'image_url', 'gps_coordinates', 'irrigation_method',
        'status', 'current_owner_id', 'nft_token_id', 'createdAt', 'updatedAt'
      ],
      include: [
        {
          model: User,
          as: 'currentOwner',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Unit purchased successfully',
      ownership,
      unit: updatedUnit
    });
  } catch (error) {
    console.error('Error purchasing unit:', error);
    res.status(500).json({ message: 'Error purchasing unit', error });
  }
};

exports.getAvailableUnits = async (req, res) => {
  try {
    const { farmId } = req.params;

    const units = await FarmUnit.findAll({
      where: {
        farm_id: farmId,
        status: 'available'
      },
      attributes: [
        'id', 'farm_id', 'unit_number', 'size_of_unit', 'price', 
        'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date',
        'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg',
        'soil_type', 'image_url', 'gps_coordinates', 'irrigation_method',
        'status', 'current_owner_id', 'nft_token_id', 'createdAt', 'updatedAt'
      ],
      order: [['price', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: units.length,
      units
    });
  } catch (error) {
    console.error('Error fetching available units:', error);
    res.status(500).json({ message: 'Error fetching available units', error });
  }
};