const { Farm, Transaction, FarmInstallmentOwnership, FarmUnitOwnership } = require('../models');
const { Op } = require('sequelize');

class OwnershipService {
  /**
   * Verify if user has full ownership of a farm
   */
  static async verifyFullOwnership(userId, farmId) {
    try {
      const farm = await Farm.findByPk(farmId);
      if (!farm) return false;

      if (!farm.is_fractional) {
        const fullPayment = await Transaction.findOne({
          where: {
            user_id: userId,
            farm_id: farmId,
            status: 'success',
            payment_type: { [Op.notIn]: ['farm_unit', 'fractional', 'fractionalInstallment', 'farm_installment', 'installment'] }
          }
        });
        if (fullPayment) return true;

        const installment = await FarmInstallmentOwnership.findOne({
          where: { 
            user_id: userId,
            farm_id: farmId,
            status: 'completed'
          }
        });
        return !!installment;
      }

      const totalUnits = farm.total_units_available;
      const ownedUnits = await FarmUnitOwnership.sum('units_purchased', {
        where: { 
          user_id: userId,
          farm_id: farmId,
          is_relisted: false
        }
      });

      return ownedUnits === totalUnits;

    } catch (error) {
      console.error('Ownership verification error:', error);
      return false;
    }
  }

  /**
   * Verify farm unit ownership
   */
  static async verifyUnitOwnership(userId, farmId, unitIds = []) {
    const where = { 
      user_id: userId,
      farm_id: farmId,
      is_relisted: false
    };

    if (unitIds.length > 0) {
      where.id = { [Op.in]: unitIds };
    }

    const units = await FarmUnitOwnership.findAll({ where });
    return unitIds.length > 0 ? units.length === unitIds.length : units.length > 0;
  }
}

module.exports = OwnershipService;