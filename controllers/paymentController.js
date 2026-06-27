const axios = require('axios');
const {
  Transaction,
  Farm,
  User,
  FarmUnitOwnership,
  FarmInstallmentOwnership,
  FarmInstallmentPayment,
  FarmImage,
  Notification,
  Sequelize,
  sequelize,
  FullFarmOwnership,
  HarvestCycle,
  InvestorProducePreference
} = require('../models');


exports.initializePayment = async (req, res) => {
  try {
    const { user_id, farm_id, unit_ids, payment_type, units = 1 } = req.body;

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const farm = await Farm.findByPk(farm_id, {
      include: [{ model: FarmUnit, as: 'units' }]
    });
    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    let selectedUnits = [];
    let totalAmount = 0;

    // If unit_ids are provided, calculate total for specific units
    if (unit_ids && unit_ids.length > 0) {
      selectedUnits = await FarmUnit.findAll({
        where: {
          id: unit_ids,
          farm_id: farm_id,
          status: 'available'
        }
      });

      if (selectedUnits.length !== unit_ids.length) {
        return res.status(400).json({ 
          message: 'One or more units are not available for purchase' 
        });
      }

      totalAmount = selectedUnits.reduce((sum, unit) => sum + parseFloat(unit.price), 0);
    } else {
      // Fallback to units count (for backward compatibility)
      const availableUnits = farm.units.filter(u => u.status === 'available');
      if (units > availableUnits.length) {
        return res.status(400).json({ message: 'Not enough units available' });
      }
      
      selectedUnits = availableUnits.slice(0, units);
      totalAmount = selectedUnits.reduce((sum, unit) => sum + parseFloat(unit.price), 0);
    }

    // Initialize payment with Paystack
    const amountInKobo = Math.round(totalAmount * 100);
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.email,
        amount: amountInKobo,
        currency: "NGN",
        callback_url: `https://ajeku-agro.vercel.app/payment-success?farmId=${farm.id}`,
        metadata: {
          user_id: user.id,
          farm_id: farm.id,
          unit_ids: selectedUnits.map(u => u.id),
          payment_type: 'farm_unit',
          total_amount: totalAmount
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.status(200).json({
      paymentUrl: response.data.data.authorization_url,
      reference: response.data.data.reference
    });

  } catch (error) {
    console.error("Payment Initialization Error:", error);
    res.status(500).json({ message: "Error initializing payment", error });
  }
};


exports.verifyPayment = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { reference } = req.query;
    if (!reference) {
      await t.rollback();
      return res.status(400).json({ message: "Transaction reference is required" });
    }

    // Check for existing transaction
    const existingTransaction = await Transaction.findOne({ 
      where: { reference },
      transaction: t
    });
    
    if (existingTransaction) {
      await t.commit();
      return res.status(200).json({
        message: "Payment already verified",
        transaction: existingTransaction
      });
    }

    // Verify with Paystack
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const paymentData = response.data.data;
    if (paymentData.status !== "success") {
      await t.rollback();
      return res.status(400).json({
        message: "Payment not successful",
        status: paymentData.status
      });
    }

    const { user_id, farm_id, unit_ids, payment_type } = paymentData.metadata || {};

    // Create transaction record
    const transaction = await Transaction.create({
      user_id,
      farm_id,
      reference,
      price: paymentData.amount / 100,
      status: paymentData.status,
      transaction_date: new Date(paymentData.transaction_date),
      payment_type: payment_type || 'farm_unit'
    }, { transaction: t });

    // Create ownership for each unit
    const ownerships = [];
    for (const unitId of unit_ids) {
      const unit = await FarmUnit.findByPk(unitId, { transaction: t });
      if (!unit || unit.status !== 'available') {
        await t.rollback();
        return res.status(400).json({ message: `Unit ${unitId} is no longer available` });
      }

      const ownership = await FarmUnitOwnership.create({
        farm_unit_id: unitId,
        user_id: user_id,
        units_purchased: 1,
        size_purchased: unit.size_of_unit,
        purchase_date: new Date()
      }, { transaction: t });

      await unit.update({
        status: 'sold',
        current_owner_id: user_id
      }, { transaction: t });

      ownerships.push(ownership);
    }

    await t.commit();

    // Send notifications
    const io = req.app.get('socketio');
    const notification = await Notification.create({
      user_id: user_id,
      title: 'Unit Purchase Successful',
      message: `You have successfully purchased ${ownerships.length} unit(s) on ${farm.name}`,
      type: 'payment',
      related_entity_id: farm_id
    });

    if (io) {
      io.to(`user_${user_id}`).emit('new_notification', {
        event: 'payment_success',
        data: notification
      });
    }

    res.status(200).json({
      message: 'Payment verified successfully',
      transaction,
      units_purchased: ownerships
    });

  } catch (error) {
    await t.rollback();
    console.error("Payment Verification Error:", error);
    res.status(500).json({ message: "Error verifying payment", error });
  }
};

exports.getFarmInstallmentStatus = async (req, res) => {
  try {
    const { userId, farmId } = req.params;

    const ownership = await FarmInstallmentOwnership.findOne({
      where: { user_id: userId, farm_id: farmId }
    });

    if (!ownership) {
      return res.status(404).json({ message: "No installment ownership found for this user & farm" });
    }

    const payments = await FarmInstallmentPayment.findAll({
      where: { user_id: userId, farm_id: farmId },
      order: [['payment_date', 'ASC']]
    });

    return res.status(200).json({
      ownership,
      payments,
      months_paid: ownership.months_paid,
      months_remaining: ownership.total_months - ownership.months_paid,
      total_months: ownership.total_months
    });

  } catch (error) {
    console.error("Error fetching installment status:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getUserFarmInstallments = async (req, res) => {
  try {
    const { userId } = req.params;

    const ownerships = await FarmInstallmentOwnership.findAll({
      where: { user_id: userId },
      include: ['farm']
    });

    return res.status(200).json({ ownerships });

  } catch (error) {
    console.error("Error fetching user installments:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.processHarvestPayout = async (req, res) => {
  try {
    const { harvest_cycle_id } = req.params;
    
    const harvestCycle = await HarvestCycle.findByPk(harvest_cycle_id, {
      include: ['farm']
    });

    if (!harvestCycle) {
      return res.status(404).json({ message: 'Harvest cycle not found' });
    }

    if (harvestCycle.status !== 'harvested') {
      return res.status(400).json({ message: 'Harvest must be harvested before processing payouts' });
    }

    const { HarvestAllocation } = require('../models');
    const allocations = await HarvestAllocation.findAll({
      where: { harvest_cycle_id },
      include: ['investor']
    });

    const results = [];
    for (const allocation of allocations) {
      if (allocation.preference_used === 'sell') {
        allocation.payout_status = 'processing';
        await allocation.save();
        results.push({
          investor_id: allocation.investor_id,
          amount: allocation.net_payout,
          status: 'processing'
        });
      } else if (allocation.preference_used === 'take_physical') {
        allocation.delivery_status = 'dispatched';
        await allocation.save();
        results.push({
          investor_id: allocation.investor_id,
          kg: allocation.allocated_kg,
          status: 'dispatched'
        });
      }
    }

    harvestCycle.status = 'distributing';
    await harvestCycle.save();

    const io = req.app.get('socketio');
    for (const allocation of allocations) {
      const notification = await Notification.create({
        user_id: allocation.investor_id,
        title: 'Harvest Payout Processing',
        message: allocation.preference_used === 'sell' 
          ? `Your harvest payout of ${allocation.net_payout} is being processed`
          : `Your harvest allocation of ${allocation.allocated_kg}kg is being dispatched`,
        type: 'harvest',
        related_entity_id: harvest_cycle_id,
        metadata: {
          allocation_id: allocation.id,
          harvest_cycle_id: harvest_cycle_id
        }
      });

      if (io) {
        io.to(`user_${allocation.investor_id}`).emit('new_notification', {
          event: 'harvest_payout',
          data: notification
        });
      }
    }

    res.status(200).json({
      message: 'Harvest payouts initiated successfully',
      results
    });

  } catch (error) {
    console.error('Error processing harvest payout:', error);
    res.status(500).json({ message: 'Error processing harvest payout', error });
  }
};

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