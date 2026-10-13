module.exports = (sequelize, DataTypes) => {
  const Verification = sequelize.define(
    'Verification',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      affiliateId: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isEmail: true },
      },
      scanCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 },
      },
      firstSeenAt: { type: DataTypes.DATE, allowNull: false },
      lastSeenAt: { type: DataTypes.DATE, allowNull: false },
      lastIp: { type: DataTypes.STRING, allowNull: true },
      lastUserAgent: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: 'verifications',
      schema: 'affiliate',
      indexes: [
        {
          unique: true,
          fields: ['affiliate_id', 'email'],
          name: 'affiliate_verifications_unique_affiliate_email',
        },
      ],
    }
  );
  return Verification;
};