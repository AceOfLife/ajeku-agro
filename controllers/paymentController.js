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
    const { user_id, farm_id, payment_type, units = 1 } = req.body;

    const user = await User.findByPk(user_id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const farm = await Farm.findByPk(farm_id);
    if (!farm) return res.status(404).json({ message: 'Farm not found' });

    if (payment_type === "full" && farm.is_sold_out) {
      return res.status(400).json({ message: 'Farm has been fully subscribed' });
    }

    let amount = farm.price_per_unit;

    if (payment_type === "farm_unit" && farm.is_fractional) {
      if (!farm.price_per_unit || !farm.total_units_available) {
        return res.status(400).json({ message: 'Invalid farm unit setup' });
      }
      if (units > farm.total_units_available) {
        return res.status(400).json({ message: 'Not enough farm units available' });
      }
      amount = farm.price_per_unit * units;
    }
    else if (payment_type === "farm_installment" && farm.isInstallment) {
      if (farm.is_fractional) {
        if (!farm.price_per_unit || !farm.total_units_available) {
          return res.status(400).json({ message: 'Invalid farm unit installment setup' });
        }
        if (units > farm.total_units_available) {
          return res.status(400).json({ message: 'Not enough farm units available' });
        }
        amount = (farm.price_per_unit * units) / farm.duration;
      } else {
        if (!farm.duration || farm.duration <= 0) {
          return res.status(400).json({ message: 'Invalid installment setup' });
        }
        amount = farm.price_per_unit / farm.duration;
      }
    }
    else if (payment_type === "fractionalInstallment" && farm.is_fractional && farm.isFractionalInstallment) {
      if (!farm.price_per_unit || !farm.isFractionalDuration || !farm.total_units_available) {
        return res.status(400).json({ message: 'Invalid fractional installment duration setup' });
      }
      if (units > farm.total_units_available) {
        return res.status(400).json({ message: 'Not enough farm units available' });
      }
      amount = (farm.price_per_unit * units) / farm.isFractionalDuration;
    }

    const amountInKobo = Math.round(amount * 100);
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
          payment_type,
          units,
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
    console.error("Payment Initialization Error:", {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({ 
      message: "Error initializing payment",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.verifyPayment = async (req, res) => {
  const t = await sequelize.transaction({
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ
  });
  
  try {
    const { reference } = req.query;
    if (!reference) {
      await t.rollback();
      return res.status(400).json({ message: "Transaction reference is required" });
    }

    const existingTransaction = await Transaction.findOne({ 
      where: { reference },
      transaction: t
    });
    
    if (existingTransaction) {
      await t.commit();
      return res.status(200).json({
        message: "The Payment has been verified already",
        transaction: existingTransaction
      });
    }

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
        status: paymentData.status,
        gateway_response: paymentData.gateway_response
      });
    }

    const { user_id, farm_id, payment_type, units = 1 } = paymentData.metadata || {};
    if (!user_id || !farm_id || !payment_type) {
      await t.rollback();
      return res.status(400).json({ message: "Incomplete payment metadata" });
    }

    const [user, farm] = await Promise.all([
      User.findByPk(user_id, { transaction: t }),
      Farm.findByPk(farm_id, { 
        transaction: t,
        lock: true
      })
    ]);

    if (!user || !farm) {
      await t.rollback();
      return res.status(404).json({ 
        message: `${!user ? 'User' : 'Farm'} not found` 
      });
    }

    const transaction = await Transaction.create({
      user_id,
      farm_id,
      reference,
      price: paymentData.amount / 100,
      currency: paymentData.currency,
      status: paymentData.status,
      transaction_date: new Date(paymentData.transaction_date),
      payment_type,
      units_purchased: units
    }, { transaction: t });

    const io = req.app.get('socketio');

    const clientNotification = await Notification.create({
      user_id: user_id,
      title: 'Payment Successful',
      message: `Your ${payment_type} payment for ${farm.name} was completed successfully`,
      type: 'payment',
      related_entity_id: farm_id,
      metadata: {
        transaction_id: transaction.id,
        amount: paymentData.amount / 100,
        currency: paymentData.currency,
        units_purchased: units
      }
    }, { transaction: t });

    const admins = await User.findAll({ 
      where: { role: 'admin' },
      transaction: t
    });

    const adminNotifications = await Promise.all(
      admins.map(admin => 
        Notification.create({
          user_id: admin.id,
          title: 'New Payment Received',
          message: `Investor ${user.email} completed a ${payment_type} payment (${paymentData.currency} ${paymentData.amount/100}) for ${farm.name}`,
          type: 'admin_alert',
          related_entity_id: transaction.id,
          metadata: {
            user_id: user_id,
            farm_id: farm_id,
            payment_type: payment_type,
            units_purchased: units
          }
        }, { transaction: t })
      )
    );

    const getAvailableFarmUnits = async (farmId) => {
      const ownerships = await FarmUnitOwnership.findAll({ 
        where: { farm_id: farmId },
        transaction: t
      });
      const totalPurchased = ownerships.reduce((sum, o) => sum + parseFloat(o.units_purchased || 0), 0);
      return farm.total_units_available - totalPurchased;
    };

    if (payment_type === "full") {
      await FullFarmOwnership.create({
        user_id,
        farm_id,
        purchase_amount: paymentData.amount / 100,
        purchase_date: new Date(),
        units_owned: units
      }, { transaction: t });

      await Farm.update({
        is_sold_out: true,
        original_owner_id: user_id
      }, {
        where: { id: farm_id },
        transaction: t
      });

      await t.commit();
      
      if (io) {
        io.to(`user_${user_id}`).emit('new_notification', {
          event: 'payment_success',
          data: clientNotification
        });

        adminNotifications.forEach(notif => {
          io.to(`user_${notif.user_id}`).emit('new_notification', {
            event: 'admin_payment_alert',
            data: notif
          });
        });
      }

      return res.status(200).json({
        message: "Full farm purchase verified successfully",
        transaction,
        ownership: {
          type: 'full',
          purchase_amount: paymentData.amount / 100,
          purchase_date: new Date(),
          units_owned: units
        }
      });
    }

    if (payment_type === "farm_unit" && farm.is_fractional) {
      const availableUnits = await getAvailableFarmUnits(farm.id);
      if (units > availableUnits) {
        await t.rollback();
        return res.status(400).json({ message: 'Not enough farm units available (post-payment)' });
      }

      await FarmUnitOwnership.create({
        user_id,
        farm_id,
        units_purchased: units,
        size_purchased: units * parseFloat(farm.unit_size)
      }, { transaction: t });

      await t.commit();
      
      if (io) {
        io.to(`user_${user_id}`).emit('new_notification', {
          event: 'payment_success',
          data: clientNotification
        });

        adminNotifications.forEach(notif => {
          io.to(`user_${notif.user_id}`).emit('new_notification', {
            event: 'admin_payment_alert',
            data: notif
          });
        });
      }

      return res.status(200).json({
        message: "Farm unit payment verified successfully",
        transaction,
        unitsPurchased: units,
        availableUnits: availableUnits - units
      });
    }

    if (payment_type === "fractionalInstallment" && farm.is_fractional && farm.isFractionalInstallment) {
      const today = new Date();
      let ownership = await FarmInstallmentOwnership.findOne({
        where: { user_id, farm_id },
        transaction: t
      });

      if (!ownership) {
        const availableUnits = await getAvailableFarmUnits(farm.id);
        if (units > availableUnits) {
          await t.rollback();
          return res.status(400).json({ message: 'Not enough farm units available (post-payment)' });
        }

        ownership = await FarmInstallmentOwnership.create({
          user_id,
          farm_id,
          start_date: today,
          total_months: farm.isFractionalDuration,
          months_paid: 1,
          status: farm.isFractionalDuration === 1 ? "completed" : "ongoing"
        }, { transaction: t });

        await FarmUnitOwnership.create({
          user_id,
          farm_id,
          units_purchased: units,
          size_purchased: units * parseFloat(farm.unit_size)
        }, { transaction: t });
      } else {
        ownership.months_paid += 1;
        if (ownership.months_paid >= ownership.total_months) {
          ownership.status = "completed";
        }
        await ownership.save({ transaction: t });
      }

      await FarmInstallmentPayment.create({
        ownership_id: ownership.id,
        user_id,
        farm_id,
        amount_paid: paymentData.amount / 100,
        payment_month: today.getMonth() + 1,
        payment_year: today.getFullYear()
      }, { transaction: t });

      await t.commit();

      if (io) {
        io.to(`user_${user_id}`).emit('new_notification', {
          event: 'payment_success',
          data: clientNotification
        });

        adminNotifications.forEach(notif => {
          io.to(`user_${notif.user_id}`).emit('new_notification', {
            event: 'admin_payment_alert',
            data: notif
          });
        });
      }

      return res.status(200).json({
        message: "Fractional installment payment verified successfully",
        transaction,
        monthsPaid: ownership.months_paid,
        monthsRemaining: ownership.total_months - ownership.months_paid,
        status: ownership.status,
        availableUnits: await getAvailableFarmUnits(farm.id)
      });
    }

    if (payment_type === "farm_installment" && farm.isInstallment && !farm.is_fractional) {
      const today = new Date();
      let ownership = await FarmInstallmentOwnership.findOne({
        where: { user_id, farm_id },
        transaction: t
      });

      if (!ownership) {
        ownership = await FarmInstallmentOwnership.create({
          user_id,
          farm_id,
          start_date: today,
          total_months: parseInt(farm.duration),
          months_paid: 1,
          status: parseInt(farm.duration) === 1 ? "completed" : "ongoing"
        }, { transaction: t });
      } else {
        ownership.months_paid += 1;
        if (ownership.months_paid >= ownership.total_months) {
          ownership.status = "completed";
        }
        await ownership.save({ transaction: t });
      }

      await FarmInstallmentPayment.create({
        ownership_id: ownership.id,
        user_id,
        farm_id,
        amount_paid: paymentData.amount / 100,
        payment_month: today.getMonth() + 1,
        payment_year: today.getFullYear()
      }, { transaction: t });

      await t.commit();

      if (io) {
        io.to(`user_${user_id}`).emit('new_notification', {
          event: 'payment_success',
          data: clientNotification
        });

        adminNotifications.forEach(notif => {
          io.to(`user_${notif.user_id}`).emit('new_notification', {
            event: 'admin_payment_alert',
            data: notif
          });
        });
      }

      return res.status(200).json({
        message: "Farm installment payment verified successfully",
        transaction,
        monthsPaid: ownership.months_paid,
        monthsRemaining: ownership.total_months - ownership.months_paid,
        status: ownership.status
      });
    }

    await t.commit();
    
    if (io) {
      io.to(`user_${user_id}`).emit('new_notification', {
        event: 'payment_success',
        data: clientNotification
      });

      adminNotifications.forEach(notif => {
        io.to(`user_${notif.user_id}`).emit('new_notification', {
          event: 'admin_payment_alert',
          data: notif
        });
      });
    }

    return res.status(200).json({
      message: "Payment verified, but no specific ownership type was processed",
      transaction
    });

  } catch (error) {
    await t.rollback();
    console.error("Payment Verification Error:", {
      message: error.message,
      reference: req.query.reference,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    return res.status(500).json({ 
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