'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { QueryTypes } = Sequelize;

    // 1. Add verification_token to sales
    await queryInterface.addColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'verification_token',
      { type: Sequelize.UUID, allowNull: true, unique: true }
    );

    // 2. Create buyers table
    await queryInterface.createTable(
      { tableName: 'buyers', schema: 'affiliate' },
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
        buyer_token: { type: Sequelize.UUID, allowNull: false, unique: true },
        scan_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        first_seen_at: { type: Sequelize.DATE, allowNull: false },
        last_seen_at: { type: Sequelize.DATE, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }
    );

    await queryInterface.addConstraint(
      { tableName: 'buyers', schema: 'affiliate' },
      {
        type: 'unique',
        fields: ['affiliate_id', 'email'],
        name: 'affiliate_buyers_unique_affiliate_email',
      }
    );

    await queryInterface.addIndex(
      { tableName: 'buyers', schema: 'affiliate' },
      ['affiliate_id'],
      { name: 'affiliate_buyers_affiliate_idx' }
    );

    // 3. Add sale_id, buyer_id to verifications
    await queryInterface.addColumn(
      { tableName: 'verifications', schema: 'affiliate' },
      'sale_id',
      {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: { tableName: 'sales', schema: 'affiliate' }, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }
    );

    await queryInterface.addColumn(
      { tableName: 'verifications', schema: 'affiliate' },
      'buyer_id',
      {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: { tableName: 'buyers', schema: 'affiliate' }, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }
    );

    // 3a. Drop the old unique constraint (affiliate_id, email) — no longer valid
    await queryInterface.removeConstraint(
      { tableName: 'verifications', schema: 'affiliate' },
      'affiliate_verifications_unique_affiliate_email'
    ).catch(() => null);

    await queryInterface.addIndex(
      { tableName: 'verifications', schema: 'affiliate' },
      ['sale_id'],
      { name: 'affiliate_verifications_sale_idx' }
    );

    await queryInterface.addIndex(
      { tableName: 'verifications', schema: 'affiliate' },
      ['buyer_id'],
      { name: 'affiliate_verifications_buyer_idx' }
    );

    // 4. Backfill: create buyers for each unique (affiliate_id, email) in verifications
    await queryInterface.sequelize.query(
      `
      INSERT INTO "affiliate"."buyers"
        (id, affiliate_id, name, email, buyer_token, scan_count, first_seen_at, last_seen_at, created_at, updated_at)
      SELECT
        gen_random_uuid(),
        v.affiliate_id,
        v.name,
        v.email,
        gen_random_uuid(),
        v.scan_count,
        v.first_seen_at,
        v.last_seen_at,
        NOW(),
        NOW()
      FROM (
        SELECT DISTINCT ON (affiliate_id, email)
          affiliate_id, name, email, scan_count, first_seen_at, last_seen_at
        FROM "affiliate"."verifications"
        ORDER BY affiliate_id, email, last_seen_at DESC
      ) v
      ON CONFLICT DO NOTHING
      `,
      { type: QueryTypes.INSERT }
    );

    // 5. Backfill: link each verification to its buyer
    await queryInterface.sequelize.query(
      `
      UPDATE "affiliate"."verifications" v
      SET buyer_id = b.id
      FROM "affiliate"."buyers" b
      WHERE b.affiliate_id = v.affiliate_id
        AND b.email = v.email
        AND v.buyer_id IS NULL
      `,
      { type: QueryTypes.UPDATE }
    );

    // 6. Backfill: match verifications to completed sales for the same affiliate
    //    on the same calendar day (nearest in time wins).
    await queryInterface.sequelize.query(
      `
      UPDATE "affiliate"."verifications" v
      SET sale_id = sub.sale_id
      FROM (
        SELECT DISTINCT ON (v2.id)
          v2.id AS verification_id,
          s.id AS sale_id
        FROM "affiliate"."verifications" v2
        JOIN "affiliate"."sales" s
          ON s.affiliate_id = v2.affiliate_id
         AND s.status = 'completed'
         AND DATE(s.created_at) = DATE(v2.last_seen_at)
        WHERE v2.sale_id IS NULL
        ORDER BY v2.id, ABS(EXTRACT(EPOCH FROM (s.created_at - v2.last_seen_at))) ASC
      ) sub
      WHERE v.id = sub.verification_id
      `,
      { type: QueryTypes.UPDATE }
    );

    // 6a. Add new unique constraint: one verification row per (sale_id, buyer_id).
    //     Only applies when both are non-null (old backfilled rows may have NULLs).
    await queryInterface.addConstraint(
      { tableName: 'verifications', schema: 'affiliate' },
      {
        type: 'unique',
        fields: ['sale_id', 'buyer_id'],
        name: 'affiliate_verifications_unique_sale_buyer',
      }
    ).catch(() => null); // ignore if duplicate NULL combos exist — safe on nulls in Postgres

    // 7. Generate verification_token for existing completed sales that lack one
    await queryInterface.sequelize.query(
      `
      UPDATE "affiliate"."sales"
      SET verification_token = gen_random_uuid()
      WHERE status = 'completed' AND verification_token IS NULL
      `,
      { type: QueryTypes.UPDATE }
    );

    // 8. Drop qr_token from users
    await queryInterface.removeColumn(
      { tableName: 'users', schema: 'affiliate' },
      'qr_token'
    );
  },

  async down(queryInterface, Sequelize) {
    // Re-add qr_token (empty)
    await queryInterface.addColumn(
      { tableName: 'users', schema: 'affiliate' },
      'qr_token',
      { type: Sequelize.UUID, allowNull: true, unique: true }
    );

    // Drop the new unique constraint
    await queryInterface.removeConstraint(
      { tableName: 'verifications', schema: 'affiliate' },
      'affiliate_verifications_unique_sale_buyer'
    ).catch(() => null);

    // Re-add the old unique constraint (for rollback fidelity)
    await queryInterface.addConstraint(
      { tableName: 'verifications', schema: 'affiliate' },
      {
        type: 'unique',
        fields: ['affiliate_id', 'email'],
        name: 'affiliate_verifications_unique_affiliate_email',
      }
    ).catch(() => null);

    await queryInterface.removeIndex(
      { tableName: 'verifications', schema: 'affiliate' },
      'affiliate_verifications_buyer_idx'
    );
    await queryInterface.removeIndex(
      { tableName: 'verifications', schema: 'affiliate' },
      'affiliate_verifications_sale_idx'
    );
    await queryInterface.removeColumn(
      { tableName: 'verifications', schema: 'affiliate' },
      'buyer_id'
    );
    await queryInterface.removeColumn(
      { tableName: 'verifications', schema: 'affiliate' },
      'sale_id'
    );

    await queryInterface.dropTable({
      tableName: 'buyers',
      schema: 'affiliate',
    });

    await queryInterface.removeColumn(
      { tableName: 'sales', schema: 'affiliate' },
      'verification_token'
    );
  },
};