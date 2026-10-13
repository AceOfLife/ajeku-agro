const crypto = require('crypto');
const { User } = require('../models');

const VERIFY_BASE_URL =
  process.env.AFFILIATE_VERIFY_BASE_URL || 'https://ajeku-agro.vercel.app/verify';

/**
 * Build the buyer-facing verification URL from an affiliate's token.
 */
function buildVerificationUrl(token) {
  const base = VERIFY_BASE_URL.replace(/\/+$/, ''); // strip trailing slashes
  return `${base}/${token}`;
}

/**
 * Ensure the affiliate has a qr_token. Idempotent.
 *  - If a token exists, returns it unchanged.
 *  - If missing, generates a new UUID, saves it, returns it.
 * Throws if the user is not an affiliate.
 */
async function ensureAffiliateQr(affiliateId) {
  const affiliate = await User.findOne({
    where: { id: affiliateId, role: 'affiliate' },
  });
  if (!affiliate) {
    const err = new Error('Affiliate not found');
    err.statusCode = 404;
    throw err;
  }

  if (!affiliate.qrToken) {
    affiliate.qrToken = crypto.randomUUID();
    await affiliate.save();
  }

  return {
    affiliateId: affiliate.id,
    affiliateName: affiliate.name,
    qrToken: affiliate.qrToken,
    verificationUrl: buildVerificationUrl(affiliate.qrToken),
  };
}

/**
 * Read-only: fetch an affiliate's QR. 404 if it hasn't been generated yet.
 */
async function getAffiliateQr(affiliateId) {
  const affiliate = await User.findOne({
    where: { id: affiliateId, role: 'affiliate' },
    attributes: ['id', 'name', 'qrToken'],
  });
  if (!affiliate) {
    const err = new Error('Affiliate not found');
    err.statusCode = 404;
    throw err;
  }
  if (!affiliate.qrToken) {
    const err = new Error('Affiliate QR not generated yet');
    err.statusCode = 404;
    throw err;
  }

  return {
    affiliateId: affiliate.id,
    affiliateName: affiliate.name,
    qrToken: affiliate.qrToken,
    verificationUrl: buildVerificationUrl(affiliate.qrToken),
  };
}

/**
 * Resolve an affiliate by QR token (used by the public verify endpoints).
 */
async function findAffiliateByQrToken(token) {
  return User.findOne({
    where: { qrToken: token, role: 'affiliate' },
    attributes: ['id', 'name', 'qrToken'],
  });
}

module.exports = {
  ensureAffiliateQr,
  getAffiliateQr,
  findAffiliateByQrToken,
  buildVerificationUrl,
};