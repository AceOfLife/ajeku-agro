'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      { tableName: 'sales', schema: 'affiliate' },
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        ref: { type: Sequelize.STRING, allowNull: false, unique: true },
        product_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: { tableName: 'products', schema: 'affiliate' }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        affiliate_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: { tableName: 'users', schema: 'affiliate' }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        logged_by_user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: { tableName: 'users', schema: 'affiliate' }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        quantity: { type: Sequelize.INTEGER, allowNull: false },
        unit_price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        gross_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        commission_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: false },
        commission_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        status: {
          type: Sequelize.ENUM('pending', 'completed', 'refunded'),
          allowNull: false,
          defaultValue: 'pending',
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }
    );

    await queryInterface.addIndex(
      { tableName: 'sales', schema: 'affiliate' },
      ['affiliate_id', 'status'],
      { name: 'affiliate_sales_affiliate_status_idx' }
    );
    await queryInterface.addIndex(
      { tableName: 'sales', schema: 'affiliate' },
      ['product_id'],
      { name: 'affiliate_sales_product_idx' }
    );
    await queryInterface.addIndex(
      { tableName: 'sales', schema: 'affiliate' },
      ['created_at'],
      { name: 'affiliate_sales_created_idx' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable({ tableName: 'sales', schema: 'affiliate' });
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "affiliate"."enum_sales_status";'
    );
  },
};