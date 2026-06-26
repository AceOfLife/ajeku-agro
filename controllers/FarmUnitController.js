// controllers/FarmUnitController.js
const { FarmUnit, Farm, FarmUnitOwnership, User } = require('../models');
const { Op } = require('sequelize');

exports.createUnits = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { units } = req.body;

    const farm = await Farm.findByPk(farmId);
    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    if (!units || !Array.isArray(units) || units.length === 0) {
      return res.status(400).json({ message: 'Units array is required' });
    }

    const createdUnits = [];
    for (const unitData of units) {
      const unit = await FarmUnit.create({
        farm_id: farmId,
        unit_number: unitData.unit_number,
        size_in_unit: unitData.size_in_unit,
        price: unitData.price,
        crop_type: unitData.crop_type,
        crop_description: unitData.crop_description || null,
        planting_date: unitData.planting_date || null,
        expected_harvest_date: unitData.expected_harvest_date || null,
        harvest_cycle_months: unitData.harvest_cycle_months || null,
        expected_yield_per_unit_kg: unitData.expected_yield_per_unit_kg || null,
        expected_value_per_kg: unitData.expected_value_per_kg || null,
        status: 'available'
      });
      createdUnits.push(unit);
    }

    res.status(201).json({
      success: true,
      message: `${createdUnits.length} units created successfully`,
      units: createdUnits
    });
  } catch (error) {
    console.error('Error creating units:', error);
    res.status(500).json({ message: 'Error creating units', error });
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

    res.status(200).json({
      success: true,
      message: 'Unit updated successfully',
      unit
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
      where: { id: unitId, farm_id: farmId }
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
        user_id: userId,
        status: 'active'
      }
    });

    if (existingOwnership) {
      return res.status(400).json({ message: 'You already own this unit' });
    }

    const ownership = await FarmUnitOwnership.create({
      farm_unit_id: unitId,
      user_id: userId,
      units_purchased: 1,
      size_purchased: unit.size_in_unit,
      purchase_date: new Date()
    });

    await unit.update({
      status: 'sold',
      current_owner_id: userId
    });

    res.status(200).json({
      success: true,
      message: 'Unit purchased successfully',
      ownership,
      unit
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