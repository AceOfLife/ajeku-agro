'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      { tableName: 'payments', schema: 'affiliate' },
      'payment_method',
      {
        type: Sequelize.ENUM('bank_transfer', 'cash', 'cheque', 'other'),
        allowNull: true,
      }
    );

    await queryInterface.addColumn(
      { tableName: 'payments', schema: 'affiliate' },
      'updated_by',
      {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: { tableName: 'users', schema: 'affiliate' }, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }
    );

    await queryInterface.addColumn(
      { tableName: 'payments', schema: 'affiliate' },
      'deleted_at',
      {
        type: Sequelize.DATE,
        allowNull: true,
      }
    );

    await queryInterface.addColumn(
      { tableName: 'payments', schema: 'affiliate' },
      'deleted_by',
      {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: { tableName: 'users', schema: 'affiliate' }, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }
    );

    await queryInterface.addIndex(
      { tableName: 'payments', schema: 'affiliate' },
      ['affiliate_id', 'deleted_at'],
      { name: 'affiliate_payments_affiliate_deleted_idx' }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      { tableName: 'payments', schema: 'affiliate' },
      'affiliate_payments_affiliate_deleted_idx'
    );
    await queryInterface.removeColumn({ tableName: 'payments', schema: 'affiliate' }, 'deleted_by');
    await queryInterface.removeColumn({ tableName: 'payments', schema: 'affiliate' }, 'deleted_at');
    await queryInterface.removeColumn({ tableName: 'payments', schema: 'affiliate' }, 'updated_by');
    await queryInterface.removeColumn({ tableName: 'payments', schema: 'affiliate' }, 'payment_method');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "affiliate"."enum_payments_payment_method";'
    );
  },
};