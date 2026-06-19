const { HarvestCycle, HarvestAllocation, Farm, FarmUnitOwnership, User, InvestorProducePreference, Investor,  Notification, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getHarvestCyclesByFarm = async (req, res) => {
  try {
    const { farmId } = req.params;
    
    const farm = await Farm.findByPk(farmId);
    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    const harvestCycles = await HarvestCycle.findAll({
      where: { farm_id: farmId },
      order: [['harvest_date', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: harvestCycles
    });
  } catch (error) {
    console.error('Error fetching harvest cycles:', error);
    res.status(500).json({ message: 'Error fetching harvest cycles', error });
  }
};

exports.getHarvestCycleById = async (req, res) => {
  try {
    const { harvestCycleId } = req.params;

    const harvestCycle = await HarvestCycle.findByPk(harvestCycleId, {
      include: [
        {
          model: Farm,
          as: 'farm'
        },
        {
          model: HarvestAllocation,
          as: 'allocations',
          include: [
            {
              model: User,
              as: 'investor',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!harvestCycle) {
      return res.status(404).json({ message: 'Harvest cycle not found' });
    }

    res.status(200).json({
      success: true,
      data: harvestCycle
    });
  } catch (error) {
    console.error('Error fetching harvest cycle:', error);
    res.status(500).json({ message: 'Error fetching harvest cycle', error });
  }
};

exports.createHarvestCycle = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { farm_id, harvest_date, preference_lock_date, cycle_number } = req.body;

    const farm = await Farm.findByPk(farm_id);
    if (!farm) {
      await t.rollback();
      return res.status(404).json({ message: 'Farm not found' });
    }

    const existingCycle = await HarvestCycle.findOne({
      where: { farm_id, cycle_number }
    });

    if (existingCycle) {
      await t.rollback();
      return res.status(400).json({ message: 'Cycle number already exists for this farm' });
    }

    const harvestCycle = await HarvestCycle.create({
      farm_id,
      harvest_date,
      preference_lock_date,
      cycle_number,
      status: 'upcoming'
    }, { transaction: t });

    await t.commit();

    res.status(201).json({
      success: true,
      message: 'Harvest cycle created successfully',
      data: harvestCycle
    });
  } catch (error) {
    await t.rollback();
    console.error('Error creating harvest cycle:', error);
    res.status(500).json({ message: 'Error creating harvest cycle', error });
  }
};

exports.updateHarvestCycle = async (req, res) => {
  try {
    const { harvestCycleId } = req.params;
    const { harvest_date, preference_lock_date, platform_fee_percentage } = req.body;

    const harvestCycle = await HarvestCycle.findByPk(harvestCycleId);
    if (!harvestCycle) {
      return res.status(404).json({ message: 'Harvest cycle not found' });
    }

    if (harvestCycle.status === 'harvested' || harvestCycle.status === 'distributing' || harvestCycle.status === 'completed') {
      return res.status(400).json({ message: 'Cannot update harvest cycle after harvest has been recorded' });
    }

    await harvestCycle.update({
      harvest_date: harvest_date || harvestCycle.harvest_date,
      preference_lock_date: preference_lock_date || harvestCycle.preference_lock_date,
      platform_fee_percentage: platform_fee_percentage || harvestCycle.platform_fee_percentage
    });

    res.status(200).json({
      success: true,
      message: 'Harvest cycle updated successfully',
      data: harvestCycle
    });
  } catch (error) {
    console.error('Error updating harvest cycle:', error);
    res.status(500).json({ message: 'Error updating harvest cycle', error });
  }
};

exports.recordHarvest = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { harvestCycleId } = req.params;
    const { actual_yield_kg, actual_market_price_per_kg } = req.body;

    const harvestCycle = await HarvestCycle.findByPk(harvestCycleId, {
      include: [{ model: Farm, as: 'farm' }]
    });

    if (!harvestCycle) {
      await t.rollback();
      return res.status(404).json({ message: 'Harvest cycle not found' });
    }

    if (harvestCycle.status !== 'preferences_locked') {
      await t.rollback();
      return res.status(400).json({ message: 'Harvest must have preferences locked before recording harvest' });
    }

    await harvestCycle.update({
      actual_yield_kg,
      actual_market_price_per_kg,
      status: 'harvested'
    }, { transaction: t });

    await t.commit();

    res.status(200).json({
      success: true,
      message: 'Harvest recorded successfully',
      data: harvestCycle
    });
  } catch (error) {
    await t.rollback();
    console.error('Error recording harvest:', error);
    res.status(500).json({ message: 'Error recording harvest', error });
  }
};

exports.allocateHarvest = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { harvestCycleId } = req.params;

    const harvestCycle = await HarvestCycle.findByPk(harvestCycleId, {
      include: [{ model: Farm, as: 'farm' }]
    });

    if (!harvestCycle) {
      await t.rollback();
      return res.status(404).json({ message: 'Harvest cycle not found' });
    }

    if (harvestCycle.status !== 'harvested') {
      await t.rollback();
      return res.status(400).json({ message: 'Harvest must be recorded before allocation' });
    }

    // Get all farm unit ownerships
    const ownerships = await FarmUnitOwnership.findAll({
      where: { farm_id: harvestCycle.farm_id }
    });

    if (ownerships.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'No investors found for this farm' });
    }

    // Calculate total units
    const totalUnits = ownerships.reduce((sum, o) => sum + parseFloat(o.units_purchased || 0), 0);

    // Get investor preferences for this harvest cycle
    const preferences = await InvestorProducePreference.findAll({
      where: { 
        farm_id: harvestCycle.farm_id,
        harvest_cycle_id: harvestCycleId
      }
    });

    const preferenceMap = {};
    preferences.forEach(p => {
      preferenceMap[p.investor_id] = p.preference;
    });

    const allocations = [];
    for (const ownership of ownerships) {
      const investorId = ownership.user_id;
      const unitsOwned = parseFloat(ownership.units_purchased || 0);
      const percentage = totalUnits > 0 ? (unitsOwned / totalUnits) : 0;
      const allocatedKg = harvestCycle.actual_yield_kg * percentage;

      const preference = preferenceMap[investorId] || 'sell';

      const allocation = await HarvestAllocation.create({
        harvest_cycle_id: harvestCycleId,
        investor_id: investorId,
        farm_unit_ownership_id: ownership.id,
        preference_used: preference,
        allocated_kg: allocatedKg
      }, { transaction: t });

      allocations.push(allocation);
    }

    await harvestCycle.update({ status: 'distributing' }, { transaction: t });

    await t.commit();

    res.status(200).json({
      success: true,
      message: 'Harvest allocated successfully',
      data: {
        totalInvestors: allocations.length,
        allocations
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error allocating harvest:', error);
    res.status(500).json({ message: 'Error allocating harvest', error });
  }
};

exports.distributeHarvest = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { harvestCycleId } = req.params;

    const harvestCycle = await HarvestCycle.findByPk(harvestCycleId);
    if (!harvestCycle) {
      await t.rollback();
      return res.status(404).json({ message: 'Harvest cycle not found' });
    }

    if (harvestCycle.status !== 'distributing') {
      await t.rollback();
      return res.status(400).json({ message: 'Harvest must be in distributing state' });
    }

    const allocations = await HarvestAllocation.findAll({
      where: { harvest_cycle_id: harvestCycleId }
    });

    // Process sell preferences (calculate payouts)
    for (const allocation of allocations) {
      if (allocation.preference_used === 'sell') {
        const grossPayout = allocation.allocated_kg * harvestCycle.actual_market_price_per_kg;
        const fee = grossPayout * (harvestCycle.platform_fee_percentage / 100);
        const netPayout = grossPayout - fee;

        await allocation.update({
          payout_amount: grossPayout,
          platform_fee_deducted: fee,
          net_payout: netPayout,
          payout_status: 'pending'
        }, { transaction: t });
      }
    }

    await harvestCycle.update({ status: 'completed' }, { transaction: t });

    await t.commit();

    res.status(200).json({
      success: true,
      message: 'Harvest distributed successfully',
      data: {
        totalAllocations: allocations.length,
        sellAllocations: allocations.filter(a => a.preference_used === 'sell').length,
        takeAllocations: allocations.filter(a => a.preference_used === 'take_physical').length
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error distributing harvest:', error);
    res.status(500).json({ message: 'Error distributing harvest', error });
  }
};

exports.getHarvestAllocations = async (req, res) => {
  try {
    const { harvestCycleId } = req.params;

    const allocations = await HarvestAllocation.findAll({
      where: { harvest_cycle_id: harvestCycleId },
      include: [
        {
          model: User,
          as: 'investor',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: allocations
    });
  } catch (error) {
    console.error('Error fetching harvest allocations:', error);
    res.status(500).json({ message: 'Error fetching harvest allocations', error });
  }
};

exports.getMyHarvestAllocation = async (req, res) => {
  try {
    const { harvestCycleId } = req.params;
    const userId = req.user.id;

    const investor = await Investor.findOne({
      where: { user_id: userId }
    });

    if (!investor) {
      return res.status(404).json({ message: 'Investor not found' });
    }

    const allocation = await HarvestAllocation.findOne({
      where: {
        harvest_cycle_id: harvestCycleId,
        investor_id: investor.id
      },
      include: [
        {
          model: HarvestCycle,
          as: 'harvestCycle',
          include: [{ model: Farm, as: 'farm' }]
        }
      ]
    });

    if (!allocation) {
      return res.status(404).json({ message: 'No allocation found for this harvest' });
    }

    res.status(200).json({
      success: true,
      data: allocation
    });
  } catch (error) {
    console.error('Error fetching my harvest allocation:', error);
    res.status(500).json({ message: 'Error fetching harvest allocation', error });
  }
};

exports.markPayoutComplete = async (req, res) => {
  try {
    const { allocationId } = req.params;
    const { payout_reference } = req.body;

    const allocation = await HarvestAllocation.findByPk(allocationId);
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    await allocation.update({
      payout_status: 'paid',
      payout_date: new Date(),
      payout_reference
    });

    res.status(200).json({
      success: true,
      message: 'Payout marked as complete',
      data: allocation
    });
  } catch (error) {
    console.error('Error marking payout complete:', error);
    res.status(500).json({ message: 'Error marking payout complete', error });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { allocationId } = req.params;
    const { delivery_status, tracking_number } = req.body;

    const allocation = await HarvestAllocation.findByPk(allocationId);
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    const updateData = { delivery_status };
    if (delivery_status === 'dispatched') {
      updateData.dispatch_date = new Date();
    }
    if (delivery_status === 'delivered') {
      updateData.delivery_date = new Date();
    }
    if (tracking_number) {
      updateData.tracking_number = tracking_number;
    }

    await allocation.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Delivery status updated',
      data: allocation
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ message: 'Error updating delivery status', error });
  }
};

// ===== PRODUCE PREFERENCE =====

exports.updateProducePreference = async (req, res) => {
  try {
    const { investor_id, farm_id, harvest_cycle_id, preference, delivery_address, delivery_region } = req.body;
    const userId = req.user.id;

    const investor = await Investor.findOne({
      where: { user_id: userId, id: investor_id }
    });

    if (!investor) {
      return res.status(404).json({ message: 'Investor not found' });
    }

    if (harvest_cycle_id) {
      const harvestCycle = await HarvestCycle.findByPk(harvest_cycle_id);
      if (!harvestCycle) {
        return res.status(404).json({ message: 'Harvest cycle not found' });
      }

      const now = new Date();
      const lockDate = new Date(harvestCycle.preference_lock_date);
      
      if (now >= lockDate) {
        return res.status(400).json({ 
          message: 'Preference lock date has passed. Cannot change preference for this harvest cycle.' 
        });
      }
    }

    const [preferenceRecord, created] = await InvestorProducePreference.findOrCreate({
      where: {
        investor_id,
        farm_id,
        harvest_cycle_id: harvest_cycle_id || null
      },
      defaults: {
        investor_id,
        farm_id,
        harvest_cycle_id: harvest_cycle_id || null,
        preference,
        delivery_address: preference === 'take_physical' ? delivery_address : null,
        delivery_region: preference === 'take_physical' ? delivery_region : null,
        is_locked: false
      }
    });

    if (!created) {
      preferenceRecord.preference = preference;
      preferenceRecord.delivery_address = preference === 'take_physical' ? delivery_address : null;
      preferenceRecord.delivery_region = preference === 'take_physical' ? delivery_region : null;
      await preferenceRecord.save();
    }

    const io = req.app.get('socketio');
    const notification = await Notification.create({
      user_id: userId,
      title: 'Produce Preference Updated',
      message: `Your produce preference has been updated to ${preference === 'sell' ? 'Sell Produce' : 'Take Physical Produce'}`,
      type: 'produce_preference',
      related_entity_id: farm_id,
      metadata: {
        preference,
        harvest_cycle_id
      }
    });

    if (io) {
      io.to(`user_${userId}`).emit('new_notification', {
        event: 'preference_updated',
        data: notification
      });
    }

    res.status(200).json({
      message: 'Produce preference updated successfully',
      preference: preferenceRecord
    });

  } catch (error) {
    console.error('Error updating produce preference:', error);
    res.status(500).json({ message: 'Error updating produce preference', error });
  }
};