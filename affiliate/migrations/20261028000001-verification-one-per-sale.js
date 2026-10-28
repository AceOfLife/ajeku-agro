'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { QueryTypes } = Sequelize;

    // 1. Clean up any existing duplicates: keep the earliest verification per sale_id
    await queryInterface.sequelize.query(
      `
      DELETE FROM "affiliate"."verifications" v
      USING "affiliate"."verifications" v2
      WHERE v.sale_id IS NOT NULL
        AND v.sale_id = v2.sale_id
        AND v.created_at > v2.created_at
      `,
      { type: QueryTypes.DELETE }
    );

    // 2. Drop the old composite unique constraint
    await queryInterface.removeConstraint(
      { tableName: 'verifications', schema: 'affiliate' },
      'affiliate_verifications_unique_sale_buyer'
    ).catch(() => null);

    // 3. Add unique constraint on sale_id alone
    //    NULL sale_id values (old backfilled rows) are allowed to remain multiple —
    //    Postgres treats NULLs as distinct in unique constraints.
    await queryInterface.addConstraint(
      { tableName: 'verifications', schema: 'affiliate' },
      {
        type: 'unique',
        fields: ['sale_id'],
        name: 'affiliate_verifications_unique_sale',
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      { tableName: 'verifications', schema: 'affiliate' },
      'affiliate_verifications_unique_sale'
    ).catch(() => null);

    await queryInterface.addConstraint(
      { tableName: 'verifications', schema: 'affiliate' },
      {
        type: 'unique',
        fields: ['sale_id', 'buyer_id'],
        name: 'affiliate_verifications_unique_sale_buyer',
      }
    ).catch(() => null);
  },
};