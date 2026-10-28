module.exports = (sequelize, DataTypes) => {
  const Sale = sequelize.define(
    'Sale',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      ref: { type: DataTypes.STRING, allowNull: false, unique: true },
      affiliateId: { type: DataTypes.UUID, allowNull: false },        // commission owner
      loggedByUserId: { type: DataTypes.UUID, allowNull: false },     // worker or partner
      totalGross: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      totalCommission: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
      verificationToken: {
        type: DataTypes.UUID,
        allowNull: true,
        unique: true,
      },
    },
    {
      tableName: 'sales',
      schema: 'affiliate',
    }
  );
  return Sale;
};