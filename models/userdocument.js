// models/userDocument.js
module.exports = (sequelize, DataTypes) => {
  const UserDocument = sequelize.define('UserDocument', {
    documentType: {
      type: DataTypes.ENUM('DRIVER_LICENSE', 'PASSPORT', 'NATIONAL_ID', 'FARM_LICENSE', 'CERTIFICATE_OF_OCCUPANCY'),  // Added farm license types
      allowNull: false
    },
    frontUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    backUrl: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING'
    },
    adminNotes: {
      type: DataTypes.TEXT
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    verifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'UserDocuments',
    underscored: false,
    timestamps: true
  });

  UserDocument.associate = function(models) {
    UserDocument.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
    
    UserDocument.belongsTo(models.User, {
      foreignKey: 'verifiedBy',
      as: 'verifier'
    });
  };

  return UserDocument;
};