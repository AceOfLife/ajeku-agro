const crypto = require('crypto');
const { Sale } = require('../models');

const VERIFY_BASE_URL =
  process.env.AFFILIATE_VERIFY_BASE_URL || 'https://ajeku-agro.vercel.app/verify';

/**
 * Build the buyer-facing URL for a sale's verification token.
 */
function buildVerificationUrl(token) {
  const base = VERIFY_BASE_URL.replace(/\/+$/, '');
  return `${base}/${token}`;
}

/**
 * Ensure the sale has a verification_token. Idempotent.
 * Only meaningful once the sale is completed.
 */
async function ensureSaleVerificationToken(saleId, { transaction } = {}) {
  const sale = await Sale.findByPk(saleId, { transaction });
  if (!sale) {
    const err = new Error('Sale not found');
    err.statusCode = 404;
    throw err;
  }

  if (!sale.verificationToken) {
    sale.verificationToken = crypto.randomUUID();
    await sale.save({ transaction });
  }

  return {
    saleId: sale.id,
    saleRef: sale.ref,
    verificationToken: sale.verificationToken,
    verificationUrl: buildVerificationUrl(sale.verificationToken),
  };
}

/**
 * Look up a sale by its verification token. Used by the public /verify endpoints.
 */
async function findSaleByVerificationToken(token) {
  return Sale.findOne({
    where: { verificationToken: token },
    attributes: [
      'id',
      'ref',
      'affiliateId',
      'quantity',
      'grossAmount',
      'status',
      'verificationToken',
      'createdAt',
    ],
  });
}

module.exports = {
  ensureSaleVerificationToken,
  findSaleByVerificationToken,
  buildVerificationUrl,
};