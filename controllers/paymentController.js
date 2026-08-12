// paymentController.js
const axios = require('axios');
const {
  Transaction,
  Farm,
  FarmUnit,
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
  InvestorProducePreference,
  Investor
} = require('../models');

// paymentController.js - initializePayment (Updated with specific errors)

exports.initializePayment = async (req, res) => {
  try {
    const { user_id, farm_id, unit_id, payment_type } = req.body;

    // ===== VALIDATION =====
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
        field: 'user_id',
        code: 'MISSING_FIELD'
      });
    }

    if (!farm_id) {
      return res.status(400).json({
        success: false,
        message: 'Farm ID is required',
        field: 'farm_id',
        code: 'MISSING_FIELD'
      });
    }

    if (!unit_id) {
      return res.status(400).json({
        success: false,
        message: 'Unit ID is required',
        field: 'unit_id',
        code: 'MISSING_FIELD'
      });
    }

    // ===== CHECK USER =====
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please log in again.',
        code: 'USER_NOT_FOUND'
      });
    }

    // ===== CHECK FARM =====
    const farm = await Farm.findByPk(farm_id);
    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found. The farm may have been deleted.',
        code: 'FARM_NOT_FOUND'
      });
    }

    // ===== CHECK UNIT =====
    const unit = await FarmUnit.findOne({
      where: {
        id: unit_id,
        farm_id: farm_id,
        status: 'available'
      }
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not available for purchase. It may have been sold or reserved.',
        code: 'UNIT_NOT_AVAILABLE'
      });
    }

    // ===== CHECK AMOUNT =====
    const totalAmount = parseFloat(unit.price);
    
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price for this unit. Please contact support.',
        code: 'INVALID_PRICE'
      });
    }

    // Paystack limits (adjust based on your account)
    const maxAmount = 100000000; // ₦100,000,000
    const minAmount = 100; // ₦100

    if (totalAmount > maxAmount) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds maximum allowed (₦${maxAmount.toLocaleString()}). Please contact support.`,
        code: 'AMOUNT_TOO_LARGE',
        max: maxAmount
      });
    }

    if (totalAmount < minAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum amount is ₦${minAmount.toLocaleString()}.`,
        code: 'AMOUNT_TOO_SMALL',
        min: minAmount
      });
    }

    const amountInKobo = Math.round(totalAmount * 100);

    // ===== INITIALIZE PAYMENT =====
    try {
      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email: user.email,
          amount: amountInKobo,
          currency: "NGN",
          callback_url: `https://ajekutechnology.com/payment-success?farmId=${farm.id}`,
          metadata: {
            user_id: user.id,
            farm_id: farm.id,
            unit_id: unit.id,
            payment_type: payment_type || 'farm_unit',
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

      // Also save transaction record with pending status
      const transaction = await Transaction.create({
        user_id: user.id,
        farm_id: farm.id,
        reference: response.data.data.reference,
        price: totalAmount,
        status: 'pending',
        transaction_date: new Date(),
        payment_type: 'farm_unit'
      });

      res.status(200).json({
        success: true,
        message: 'Payment initialized successfully',
        paymentUrl: response.data.data.authorization_url,
        reference: response.data.data.reference,
        amount: totalAmount,
        unit: {
          id: unit.id,
          number: unit.unit_number,
          crop: unit.crop_type
        }
      });

    } catch (paystackError) {
      console.error('Paystack Error:', paystackError.response?.data || paystackError.message);
      
      // Handle Paystack specific errors
      if (paystackError.response?.data?.message) {
        return res.status(400).json({
          success: false,
          message: `Payment gateway error: ${paystackError.response.data.message}`,
          code: 'PAYSTACK_ERROR',
          paystack: paystackError.response.data
        });
      }

      // Rate limiting or network error
      if (paystackError.code === 'ECONNRESET' || paystackError.code === 'ETIMEDOUT') {
        return res.status(503).json({
          success: false,
          message: 'Payment gateway is temporarily unavailable. Please try again.',
          code: 'PAYMENT_GATEWAY_DOWN'
        });
      }

      throw paystackError;
    }

  } catch (error) {
    console.error("Payment Initialization Error:", error);
    
    // Database errors
    if (error.name === 'SequelizeConnectionError') {
      return res.status(503).json({
        success: false,
        message: 'Database connection temporarily unavailable. Please try again.',
        code: 'DB_CONNECTION_ERROR'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment. Please try again.',
      code: 'SERVER_ERROR'
    });
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

    // ✅ Check if transaction exists
    let transaction = await Transaction.findOne({ 
      where: { reference },
      transaction: t
    });
    
    // ✅ If transaction exists and is already successful, return it
    if (transaction && transaction.status === 'success') {
      await t.commit();
      return res.status(200).json({
        message: "Payment already verified",
        transaction: transaction
      });
    }

    // ✅ Verify with Paystack
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

    // Extract metadata
    const { user_id, farm_id, unit_id, payment_type } = paymentData.metadata || {};

    if (!unit_id) {
      await t.rollback();
      return res.status(400).json({ message: "No unit ID found in payment metadata" });
    }

    // ✅ If transaction exists but is pending, update it
    if (transaction && transaction.status === 'pending') {
      // Update transaction to success
      await transaction.update({
        status: 'success',
        transaction_date: new Date(paymentData.transaction_date || Date.now())
      }, { transaction: t });
    } else {
      // ✅ If no transaction exists, create one (shouldn't happen normally)
      transaction = await Transaction.create({
        user_id,
        farm_id,
        reference,
        price: paymentData.amount / 100,
        status: 'success',
        transaction_date: new Date(paymentData.transaction_date || Date.now()),
        payment_type: payment_type || 'farm_unit'
      }, { transaction: t });
    }

    // ✅ Mark unit as sold
    const unit = await FarmUnit.findByPk(unit_id, { transaction: t });
    if (!unit) {
      await t.rollback();
      return res.status(404).json({ message: `Unit ${unit_id} not found` });
    }

    if (unit.status !== 'available') {
      await t.rollback();
      return res.status(400).json({ message: `Unit ${unit.unit_number} is no longer available` });
    }

    // ✅ Create ownership record
    const ownership = await FarmUnitOwnership.create({
      farm_unit_id: unit_id,
      farm_id: farm_id,
      user_id: user_id,
      units_purchased: 1,
      size_purchased: parseFloat(unit.size_of_unit) || 0,
      purchase_amount: paymentData.amount / 100,
      purchase_date: new Date()
    }, { transaction: t });

    // ✅ Update unit status
    await unit.update({
      status: 'sold',
      current_owner_id: user_id
    }, { transaction: t });

    await t.commit();

    // ✅ Send notification
    const io = req.app.get('socketio');
    const notification = await Notification.create({
      user_id: user_id,
      title: 'Unit Purchase Successful',
      message: `You have successfully purchased unit ${unit.unit_number} for ₦${(paymentData.amount / 100).toLocaleString()}`,
      type: 'payment',
      related_entity_id: farm_id,
      metadata: {
        unit_id: unit_id,
        unit_number: unit.unit_number,
        amount: paymentData.amount / 100
      }
    });

    if (io) {
      io.to(`user_${user_id}`).emit('new_notification', {
        event: 'payment_success',
        data: notification
      });
    }

    res.status(200).json({
      message: 'Payment verified successfully',
      transaction: transaction,
      unit_purchased: ownership,
      unit: unit
    });

  } catch (error) {
    await t.rollback();
    console.error("Payment Verification Error:", error);
    res.status(500).json({ 
      message: "Error verifying payment", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
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