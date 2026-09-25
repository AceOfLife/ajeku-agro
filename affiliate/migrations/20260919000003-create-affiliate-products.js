'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      { tableName: 'products', schema: 'affiliate' },
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        name: { type: Sequelize.STRING, allowNull: false },
        description: { type: Sequelize.STRING, allowNull: true },
        image_urls: {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: [],
        },
        quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        commission_percent: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
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
      { tableName: 'products', schema: 'affiliate' },
      ['is_active'],
      { name: 'affiliate_products_active_idx' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable({ tableName: 'products', schema: 'affiliate' });
  },
};