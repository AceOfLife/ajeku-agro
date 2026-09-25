'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      { tableName: 'payments', schema: 'affiliate' },
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        ref: { type: Sequelize.STRING, allowNull: false, unique: true },
        affiliate_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: { tableName: 'users', schema: 'affiliate' }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        paid_on: { type: Sequelize.DATEONLY, allowNull: false },
        status: {
          type: Sequelize.ENUM('paid', 'pending'),
          allowNull: false,
          defaultValue: 'paid',
        },
        note: { type: Sequelize.TEXT, allowNull: true },
        created_by: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: { tableName: 'users', schema: 'affiliate' }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }
    );

    await queryInterface.addIndex(
      { tableName: 'payments', schema: 'affiliate' },
      ['affiliate_id'],
      { name: 'affiliate_payments_affiliate_idx' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable({ tableName: 'payments', schema: 'affiliate' });
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "affiliate"."enum_payments_status";'
    );
  },
};