// models/fullFarmOwnership.js (was FullOwnership.js)
module.exports = (sequelize, DataTypes) => {
  const FullFarmOwnership = sequelize.define('FullFarmOwnership', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    farm_id: {  // was property_id
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Farms', key: 'id' }  // was Properties
    },
    purchase_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    purchase_amount: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    units_owned: {  // NEW: total units owned
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    }
  }, {
    tableName: 'FullFarmOwnerships',  // was FullOwnerships
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  FullFarmOwnership.associate = (models) => {
    FullFarmOwnership.belongsTo(models.User, { 
      foreignKey: 'user_id',
      as: 'user'
    });
    FullFarmOwnership.belongsTo(models.Farm, {  // was Property
      foreignKey: 'farm_id',
      as: 'farm'
    });
  };

  return FullFarmOwnership;
};