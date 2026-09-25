'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      { tableName: 'users', schema: 'affiliate' },
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        parent_affiliate_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: { tableName: 'users', schema: 'affiliate' }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        name: { type: Sequelize.STRING, allowNull: false },
        email: { type: Sequelize.STRING, allowNull: false, unique: true },
        password_hash: { type: Sequelize.STRING, allowNull: false },
        role: {
          type: Sequelize.ENUM('admin', 'affiliate', 'worker'),
          allowNull: false,
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

    await queryInterface.addIndex(
      { tableName: 'users', schema: 'affiliate' },
      ['parent_affiliate_id'],
      { name: 'affiliate_users_parent_idx' }
    );
    await queryInterface.addIndex(
      { tableName: 'users', schema: 'affiliate' },
      ['role'],
      { name: 'affiliate_users_role_idx' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable({ tableName: 'users', schema: 'affiliate' });
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "affiliate"."enum_users_role";'
    );
  },
};