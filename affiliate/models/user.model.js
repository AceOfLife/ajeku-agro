module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      parentAffiliateId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      name: { type: DataTypes.STRING, allowNull: false },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      role: {
        type: DataTypes.ENUM('admin', 'affiliate', 'worker'),
        allowNull: false,
      },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      tableName: 'users',
      schema: 'affiliate',
    }
  );
  return User;
};