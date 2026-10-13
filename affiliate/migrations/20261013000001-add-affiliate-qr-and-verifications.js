'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add qr_token to users
    await queryInterface.addColumn(
      { tableName: 'users', schema: 'affiliate' },
      'qr_token',
      {
        type: Sequelize.UUID,
        allowNull: true,
        unique: true,
      }
    );

    // 2. Create verifications table
    await queryInterface.createTable(
      { tableName: 'verifications', schema: 'affiliate' },
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        affiliate_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: { tableName: 'users', schema: 'affiliate' }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        name: { type: Sequelize.STRING, allowNull: false },
        email: { type: Sequelize.STRING, allowNull: false },
        scan_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        first_seen_at: { type: Sequelize.DATE, allowNull: false },
        last_seen_at: { type: Sequelize.DATE, allowNull: false },
        last_ip: { type: Sequelize.STRING, allowNull: true },
        last_user_agent: { type: Sequelize.STRING, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }
    );

    // 3. Unique on (affiliate_id, email)
    await queryInterface.addConstraint(
      { tableName: 'verifications', schema: 'affiliate' },
      {
        type: 'unique',
        fields: ['affiliate_id', 'email'],
        name: 'affiliate_verifications_unique_affiliate_email',
      }
    );

    // 4. Index for fast per-affiliate listing
    await queryInterface.addIndex(
      { tableName: 'verifications', schema: 'affiliate' },
      ['affiliate_id', 'last_seen_at'],
      { name: 'affiliate_verifications_affiliate_lastseen_idx' }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      { tableName: 'verifications', schema: 'affiliate' },
      'affiliate_verifications_affiliate_lastseen_idx'
    );
    await queryInterface.removeConstraint(
      { tableName: 'verifications', schema: 'affiliate' },
      'affiliate_verifications_unique_affiliate_email'
    );
    await queryInterface.dropTable({
      tableName: 'verifications',
      schema: 'affiliate',
    });
    await queryInterface.removeColumn(
      { tableName: 'users', schema: 'affiliate' },
      'qr_token'
    );
  },
};