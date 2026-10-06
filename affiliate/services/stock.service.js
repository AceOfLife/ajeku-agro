const { AffiliateProduct } = require('../models');

class InsufficientStockError extends Error {
  constructor(affiliateProductId, available, requested) {
    super(
      `Insufficient stock for affiliate product ${affiliateProductId}: have ${available}, need ${requested}`
    );
    this.name = 'InsufficientStockError';
    this.statusCode = 400;
  }
}

async function decrementStock(affiliateProductId, quantity, { transaction } = {}) {
  if (quantity <= 0) throw new Error('Quantity must be positive');

  const ap = await AffiliateProduct.findByPk(affiliateProductId, {
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (!ap) throw Object.assign(new Error('Affiliate product not found'), { statusCode: 404 });

  if (ap.quantity < quantity) {
    throw new InsufficientStockError(affiliateProductId, ap.quantity, quantity);
  }

  ap.quantity -= quantity;
  await ap.save({ transaction });
  return ap;
}

async function restoreStock(affiliateProductId, quantity, { transaction } = {}) {
  if (quantity <= 0) throw new Error('Quantity must be positive');

  const ap = await AffiliateProduct.findByPk(affiliateProductId, {
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (!ap) throw Object.assign(new Error('Affiliate product not found'), { statusCode: 404 });

  ap.quantity += quantity;
  await ap.save({ transaction });
  return ap;
}

module.exports = {
  decrementStock,
  restoreStock,
  InsufficientStockError,
};