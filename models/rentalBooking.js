// models/RentalBooking.js
module.exports = (sequelize, DataTypes) => {
  const RentalBooking = sequelize.define("RentalBooking", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', // Matches your exact table name
        key: 'id'
      }
    },
    property_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Properties', // Matches your exact table name
        key: 'id'
      }
    },
    rooms_booked: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    amount_paid: {
      type: DataTypes.DOUBLE, // Matches double precision in DB
      allowNull: false
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'rental_bookings',
    underscored: false, // Important: your tables use camelCase
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true
  });

  RentalBooking.associate = function(models) {
    RentalBooking.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'User'
    });
    RentalBooking.belongsTo(models.Property, {
      foreignKey: 'property_id',
      as: 'Property'
    });
  };

  return RentalBooking;
};