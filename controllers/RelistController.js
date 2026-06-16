const { Farm, FullFarmOwnership, FarmUnitOwnership, FarmInstallmentOwnership, sequelize, User, Notification } = require('../models');
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

exports.relistFarmUnits = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { farmId, unitIds, pricePerUnit } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(unitIds) || unitIds.length === 0 || !pricePerUnit || pricePerUnit <= 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid request data. Provide valid unit IDs and positive price."
      });
    }

    const validUnits = await FarmUnitOwnership.findAll({
      where: {
        id: { [Op.in]: unitIds },
        user_id: userId,
        farm_id: farmId,
        units_purchased: { [Op.gt]: 0 }
      },
      transaction: t
    });

    if (validUnits.length !== unitIds.length) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: "You don't own all the specified units or they're invalid"
      });
    }

    if (validUnits.some(unit => unit.is_relisted)) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: "One or more units are already relisted"
      });
    }

    await FarmUnitOwnership.update(
      {
        is_relisted: true,
        relist_price: pricePerUnit,
        updated_at: new Date()
      },
      {
        where: { id: { [Op.in]: unitIds } },
        transaction: t
      }
    );

    const [farm, user] = await Promise.all([
      Farm.findByPk(farmId, { transaction: t }),
      User.findByPk(userId, { transaction: t })
    ]);

    let notificationsSent = false;
    try {
      const io = req.app.get('socketio');

      const clientNotification = await Notification.create({
        user_id: userId,
        title: 'Farm Units Relisted',
        message: `You've successfully relisted ${unitIds.length} unit(s) in ${farm.name}`,
        type: 'payment',
        related_entity_id: farmId,
        metadata: {
          unit_ids: unitIds,
          price_per_unit: pricePerUnit,
          farm_id: farmId,
          action: 'relist'
        }
      }, { transaction: t });

      const admins = await User.findAll({
        where: { role: 'admin' },
        transaction: t
      });

      await Promise.all(
        admins.map(admin =>
          Notification.create({
            user_id: admin.id,
            title: 'New Farm Units Relisted',
            message: `User ${user.email} relisted ${unitIds.length} unit(s) in ${farm.name}`,
            type: 'admin_alert',
            related_entity_id: farmId,
            metadata: {
              user_id: userId,
              unit_ids: unitIds,
              price_per_unit: pricePerUnit,
              farm_id: farmId,
              action: 'relist'
            }
          }, { transaction: t })
        )
      );

      notificationsSent = true;

      if (io) {
        io.to(`user_${userId}`).emit('new_notification', {
          event: 'payment_success',
          data: clientNotification
        });
      }
    } catch (notificationError) {
      console.error('Notification failed:', notificationError);
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      message: notificationsSent
        ? "Farm units relisted successfully"
        : "Farm units relisted but notifications failed",
      data: {
        relistedUnits: unitIds,
        pricePerUnit,
        notificationsEnabled: notificationsSent
      }
    });

  } catch (error) {
    await t.rollback();
    console.error('Relist units error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to relist farm units",
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
          attributes: ['id', 'name', 'email', 'contactNumber'],
          as: 'owner'
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