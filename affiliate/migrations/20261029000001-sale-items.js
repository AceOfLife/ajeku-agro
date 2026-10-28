'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create sale_items table
    await queryInterface.createTable(
      { tableName: 'sale_items', schema: 'affiliate' },
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        sale_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: { tableName: 'sales', schema: 'affiliate' }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        affiliate_product_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: { tableName: 'affiliate_products', schema: 'affiliate' }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        quantity: { type: Sequelize.INTEGER, allowNull: false },
        unit_price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        gross_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        commission_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: false },
        commission_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }
    );

    await queryInterface.addIndex(
      { tableName: 'sale_items', schema: 'affiliate' },
      ['sale_id'],
      { name: 'sale_items_sale_idx' }
    );
    await queryInterface.addIndex(
      { tableName: 'sale_items', schema: 'affiliate' },
      ['affiliate_product_id'],
      { name: 'sale_items_affiliate_product_idx' }
    );

    // 2. Add total_gross, total_commission to sales
    await queryInterface.addColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'total_gross',
      { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 }
    );
    await queryInterface.addColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'total_commission',
      { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 }
    );

    // 3. Drop old per-sale columns (data is test-only, no backfill)
    await queryInterface.removeIndex(
      { tableName: 'sales', schema: 'affiliate' },
      'affiliate_sales_affiliate_product_idx'
    ).catch(() => null);

    await queryInterface.removeColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'affiliate_product_id'
    );
    await queryInterface.removeColumn({ tableName: 'sales', schema: 'affiliate' }, 'quantity');
    await queryInterface.removeColumn({ tableName: 'sales', schema: 'affiliate' }, 'unit_price');
    await queryInterface.removeColumn({ tableName: 'sales', schema: 'affiliate' }, 'gross_amount');
    await queryInterface.removeColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'commission_percent'
    );
    await queryInterface.removeColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'commission_amount'
    );
  },

  async down(queryInterface, Sequelize) {
    // Re-add old columns (empty — data not restored)
    await queryInterface.addColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'affiliate_product_id',
      { type: Sequelize.UUID, allowNull: true }
    );
    await queryInterface.addColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'quantity',
      { type: Sequelize.INTEGER, allowNull: true }
    );
    await queryInterface.addColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'unit_price',
      { type: Sequelize.DECIMAL(12, 2), allowNull: true }
    );
    await queryInterface.addColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'gross_amount',
      { type: Sequelize.DECIMAL(12, 2), allowNull: true }
    );
    await queryInterface.addColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'commission_percent',
      { type: Sequelize.DECIMAL(5, 2), allowNull: true }
    );
    await queryInterface.addColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'commission_amount',
      { type: Sequelize.DECIMAL(12, 2), allowNull: true }
    );

    await queryInterface.removeColumn({ tableName: 'sales', schema: 'affiliate' }, 'total_gross');
    await queryInterface.removeColumn({ tableName: 'sales', schema: 'affiliate' }, 'total_commission');

    await queryInterface.dropTable({ tableName: 'sale_items', schema: 'affiliate' });
  },
};