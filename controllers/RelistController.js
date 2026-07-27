const { Farm, FullFarmOwnership, FarmUnitOwnership, FarmInstallmentOwnership, FarmUnit, sequelize, User, Notification } = require('../models');
const { Op } = require('sequelize');

exports.relistFarm = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { farmId } = req.params;
    const { relistPrice, reason } = req.body;
    const userId = req.user.id;

    const ownership = await FullFarmOwnership.findOne({
      where: {
        farm_id: farmId,
        user_id: userId
      },
      transaction: t
    });

    if (!ownership) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: "You must fully own the farm before relisting",
        details: `User ${userId} doesn't own farm ${farmId}`
      });
    }

    const farm = await Farm.findByPk(farmId, { transaction: t });
    if (farm.is_relisted) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: "Farm is already relisted"
      });
    }

    await Farm.update(
      {
        is_relisted: true,
        original_owner_id: userId,
        price_per_unit: relistPrice,
        relist_reason: reason,
        updated_at: new Date()
      },
      {
        where: { id: farmId },
        transaction: t
      }
    );

    let notificationsSent = false;
    const io = req.app.get('socketio');
    const user = await User.findByPk(userId, { transaction: t });

    try {
      const clientNotification = await Notification.create({
        user_id: userId,
        title: 'Farm Relisted',
        message: `You've relisted ${farm.name} for ₦${relistPrice.toLocaleString()}`,
        type: 'payment',
        related_entity_id: farmId,
        metadata: {
          action: 'relist',
          amount: relistPrice,
          reason: reason,
          farm_id: farmId
        },
        transaction: t
      });

      const admins = await User.findAll({
        where: { role: 'admin' },
        transaction: t
      });

      const adminNotifications = await Promise.all(
        admins.map(admin =>
          Notification.create({
            user_id: admin.id,
            title: 'Farm Relisted',
            message: `User ${user.email} relisted ${farm.name} for ₦${relistPrice.toLocaleString()}`,
            type: 'admin_alert',
            related_entity_id: farmId,
            metadata: {
              user_id: userId,
              amount: relistPrice,
              reason: reason,
              farm_id: farmId
            },
            transaction: t
          })
        )
      );

      notificationsSent = true;

      if (io) {
        io.to(`user_${userId}`).emit('new_notification', {
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
    } catch (notificationError) {
      console.error('Notification failed:', notificationError);
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      message: notificationsSent
        ? "Farm relisted successfully"
        : "Farm relisted but notifications failed",
      data: {
        farmId,
        newPrice: relistPrice,
        notificationsEnabled: notificationsSent
      }
    });

  } catch (error) {
    await t.rollback();
    console.error('Farm relist error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to relist farm",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Relist Controller
exports.relistFarmUnit = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { unitId } = req.params;
    const { relistPrice } = req.body;
    const userId = req.user.id;

    // Get the unit
    const unit = await FarmUnit.findByPk(unitId, {
      include: [{ model: Farm, as: 'farm' }],
      transaction: t
    });

    if (!unit) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    // Check ownership
    const ownership = await FarmUnitOwnership.findOne({
      where: { farm_unit_id: unitId, user_id: userId },
      order: [['createdAt', 'DESC']],
      transaction: t
    });

    if (!ownership) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: 'You do not own this unit'
      });
    }

    // Check if already relisted
    if (unit.status === 'relisted') {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: 'This unit is already relisted'
      });
    }

    // ===== CHECK AVAILABLE UNITS =====
    const availableUnits = await FarmUnit.count({
      where: {
        farm_id: unit.farm_id,
        status: 'available',
        id: { [Op.ne]: unitId }
      },
      transaction: t
    });

    const hasAvailableUnits = availableUnits > 0;

    // ===== PRICING RULES =====
    const originalPrice = parseFloat(ownership.purchase_amount || unit.price);
    const proposedPrice = parseFloat(relistPrice);
    
    let minPrice, maxPrice;

    if (hasAvailableUnits) {
      // Scenario 1: Units still available
      minPrice = originalPrice * 0.80;  // 80%
      maxPrice = originalPrice * 0.95;  // 95%
    } else {
      // Scenario 2: No units available (fully sold out)
      minPrice = originalPrice * 0.80;  // 80%
      maxPrice = originalPrice * 1.20;  // 120% ← PREMIUM PRICING
    }

    // Validate price
    if (proposedPrice < minPrice) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Minimum relist price is ${minPrice.toLocaleString()} (80% of original)`,
        rules: {
          minPrice,
          maxPrice,
          originalPrice,
          hasAvailableUnits,
          availableUnits
        }
      });
    }

    if (proposedPrice > maxPrice) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: hasAvailableUnits 
          ? `Maximum relist price is ${maxPrice.toLocaleString()} (95% of original) because there are still ${availableUnits} unit(s) available on this farm`
          : `Maximum relist price is ${maxPrice.toLocaleString()} (120% of original) because this farm is fully sold out`,
        rules: {
          minPrice,
          maxPrice,
          originalPrice,
          hasAvailableUnits,
          availableUnits
        }
      });
    }

    // Update unit to relisted
    await unit.update({
      status: 'relisted',
      relist_price: proposedPrice,
      relist_date: new Date(),
      relist_original_price: originalPrice
    }, { transaction: t });

    // Calculate platform fee (5%)
    const platformFee = proposedPrice * 0.05;
    const sellerPayout = proposedPrice - platformFee;

    await t.commit();

    return res.status(200).json({
      success: true,
      message: 'Unit relisted successfully',
      data: {
        unit: {
          id: unit.id,
          unit_number: unit.unit_number,
          crop_type: unit.crop_type,
          status: 'relisted',
          original_price: originalPrice,
          relist_price: proposedPrice,
          platform_fee: platformFee,
          seller_payout: sellerPayout,
          has_available_units: hasAvailableUnits,
          available_units_count: availableUnits,
          pricing_rule: hasAvailableUnits ? 'standard' : 'premium'
        }
      }
    });

  } catch (error) {
    await t.rollback();
    console.error('Relist error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to relist unit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.checkRelistEligibility = async (req, res) => {
  try {
    const { farmId } = req.params;
    const userId = req.user.id;

    const [fullOwnership, fractionalOwnership, installmentOwnership] = await Promise.all([
      FullFarmOwnership.findOne({
        where: {
          user_id: userId,
          farm_id: farmId
        }
      }),
      FarmUnitOwnership.findOne({
        where: {
          user_id: userId,
          farm_id: farmId,
          units_purchased: { [Op.gt]: 0 }
        }
      }),
      FarmInstallmentOwnership.findOne({
        where: {
          user_id: userId,
          farm_id: farmId,
          status: 'completed'
        }
      })
    ]);

    const canRelist = fullOwnership !== null ||
                     fractionalOwnership !== null ||
                     installmentOwnership !== null;

    res.status(200).json({
      success: true,
      canRelist,
      message: canRelist
        ? "User can relist this farm"
        : "User cannot relist - no valid ownership or incomplete payments"
    });

  } catch (error) {
    console.error('Relist eligibility check error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to check relist eligibility",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getRelistedFarmUnits = async (req, res) => {
  try {
    const { farmId } = req.params;

    const farm = await Farm.findByPk(farmId);
    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    const relistedUnits = await FarmUnitOwnership.findAll({
      where: {
        farm_id: farmId,
        is_relisted: true
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'contactNumber']
          // Removed 'as: owner'
        }
      ],
      order: [['relist_price', 'ASC']]
    });

    const totalUnits = farm.total_units_available;
    const availableUnits = totalUnits - await FarmUnitOwnership.sum('units_purchased', {
      where: { farm_id: farmId }
    });

    res.status(200).json({
      success: true,
      farm: {
        id: farm.id,
        name: farm.name,
        total_units: totalUnits,
        available_units: availableUnits
      },
      units: relistedUnits,
      count: relistedUnits.length
    });
  } catch (error) {
    console.error('Error fetching relisted farm units:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch relisted farm units',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  checkRelistEligibility,
  relistFarm,
  relistFarmUnits,
  getRelistedFarmUnits,
  relistFarmUnit 
};