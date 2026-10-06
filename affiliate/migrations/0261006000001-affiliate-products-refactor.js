'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { QueryTypes } = Sequelize;

    // 1. Create the join table
    await queryInterface.createTable(
      { tableName: 'affiliate_products', schema: 'affiliate' },
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
        product_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: { tableName: 'products', schema: 'affiliate' }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        commission_percent: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
        },
        quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }
    );

    await queryInterface.addConstraint(
      { tableName: 'affiliate_products', schema: 'affiliate' },
      {
        type: 'unique',
        fields: ['affiliate_id', 'product_id'],
        name: 'affiliate_products_unique_affiliate_product',
      }
    );

    await queryInterface.addIndex(
      { tableName: 'affiliate_products', schema: 'affiliate' },
      ['affiliate_id'],
      { name: 'affiliate_products_affiliate_idx' }
    );
    await queryInterface.addIndex(
      { tableName: 'affiliate_products', schema: 'affiliate' },
      ['product_id'],
      { name: 'affiliate_products_product_idx' }
    );

    // 2. Migrate existing products → affiliate_products.
    //    For every existing product, create one affiliate_product row for
    //    each affiliate that has already sold it. This preserves sales history.
    //    Products that have never been sold are left without assignments
    //    (admin assigns them going forward).
    await queryInterface.sequelize.query(
      `
      INSERT INTO "affiliate"."affiliate_products"
        (id, affiliate_id, product_id, commission_percent, quantity, is_active, created_at, updated_at)
      SELECT
        gen_random_uuid(),
        s.affiliate_id,
        s.product_id,
        p.commission_percent,
        0,
        true,
        NOW(),
        NOW()
      FROM (
        SELECT DISTINCT affiliate_id, product_id
        FROM "affiliate"."sales"
      ) s
      JOIN "affiliate"."products" p ON p.id = s.product_id
      ON CONFLICT DO NOTHING
      `,
      { type: QueryTypes.INSERT }
    );

    // 3. Add affiliate_product_id to sales
    await queryInterface.addColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'affiliate_product_id',
      {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: { tableName: 'affiliate_products', schema: 'affiliate' }, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      }
    );

    // 4. Backfill: map each existing sale to the matching affiliate_product
    await queryInterface.sequelize.query(
      `
      UPDATE "affiliate"."sales" s
      SET affiliate_product_id = ap.id
      FROM "affiliate"."affiliate_products" ap
      WHERE ap.affiliate_id = s.affiliate_id
        AND ap.product_id = s.product_id
      `,
      { type: QueryTypes.UPDATE }
    );

    // 5. Drop old product_id FK and column from sales
    await queryInterface.removeIndex(
      { tableName: 'sales', schema: 'affiliate' },
      'affiliate_sales_product_idx'
    );
    await queryInterface.removeConstraint(
      { tableName: 'sales', schema: 'affiliate' },
      'sales_product_id_fkey'
    ).catch(() => null);
    await queryInterface.removeColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'product_id'
    );

    // 6. Make affiliate_product_id NOT NULL now that backfill is done
    await queryInterface.changeColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'affiliate_product_id',
      { type: Sequelize.UUID, allowNull: false }
    );

    // 7. Remove commission_percent and quantity from products (catalog is now global)
    await queryInterface.removeColumn(
      { tableName: 'products', schema: 'affiliate' },
      'commission_percent'
    );
    await queryInterface.removeColumn(
      { tableName: 'products', schema: 'affiliate' },
      'quantity'
    );

    // 8. Add index on sales.affiliate_product_id
    await queryInterface.addIndex(
      { tableName: 'sales', schema: 'affiliate' },
      ['affiliate_product_id'],
      { name: 'affiliate_sales_affiliate_product_idx' }
    );
  },

  async down(queryInterface, Sequelize) {
    // Best-effort reversal: restore columns, backfill, drop new FK
    await queryInterface.addColumn(
      { tableName: 'products', schema: 'affiliate' },
      'commission_percent',
      { type: Sequelize.DECIMAL(5, 2), allowNull: true }
    );
    await queryInterface.addColumn(
      { tableName: 'products', schema: 'affiliate' },
      'quantity',
      { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 }
    );

    await queryInterface.addColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'product_id',
      { type: Sequelize.UUID, allowNull: true }
    );

    await queryInterface.sequelize.query(`
      UPDATE "affiliate"."sales" s
      SET product_id = ap.product_id
      FROM "affiliate"."affiliate_products" ap
      WHERE ap.id = s.affiliate_product_id
    `);

    await queryInterface.removeIndex(
      { tableName: 'sales', schema: 'affiliate' },
      'affiliate_sales_affiliate_product_idx'
    );
    await queryInterface.removeColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'affiliate_product_id'
    );
    await queryInterface.dropTable({
      tableName: 'affiliate_products',
      schema: 'affiliate',
    });
  },
};