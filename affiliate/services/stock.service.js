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

/**
 * Decrement stock for a batch of items atomically.
 * All rows are locked and validated first, then decremented.
 * If any row is missing or has insufficient stock, no changes are made.
 *
 * items: [{ affiliateProductId, quantity }]
 */
async function decrementStockBatch(items, { transaction } = {}) {
  if (!items || items.length === 0) return [];

  // 1. Validate
  for (const item of items) {
    if (!item.affiliateProductId) {
      throw Object.assign(new Error('Each item requires affiliateProductId'), { statusCode: 400 });
    }
    if (!item.quantity || item.quantity <= 0) {
      throw Object.assign(new Error('Each item requires quantity > 0'), { statusCode: 400 });
    }
  }

  // 2. Fetch + lock all rows
  const ids = items.map((i) => i.affiliateProductId);
  const rows = await AffiliateProduct.findAll({
    where: { id: ids },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  const rowMap = new Map(rows.map((r) => [r.id, r]));

  // 3. Check all exist + have stock
  for (const item of items) {
    const ap = rowMap.get(item.affiliateProductId);
    if (!ap) {
      throw Object.assign(new Error(`Affiliate product ${item.affiliateProductId} not found`), {
        statusCode: 404,
      });
    }
    if (ap.quantity < item.quantity) {
      throw new InsufficientStockError(item.affiliateProductId, ap.quantity, item.quantity);
    }
  }

  // 4. Decrement all
  const updated = [];
  for (const item of items) {
    const ap = rowMap.get(item.affiliateProductId);
    ap.quantity -= item.quantity;
    await ap.save({ transaction });
    updated.push(ap);
  }

  return updated;
}

/**
 * Restore stock for a batch of items atomically.
 * items: [{ affiliateProductId, quantity }]
 */
async function restoreStockBatch(items, { transaction } = {}) {
  if (!items || items.length === 0) return [];

  const ids = items.map((i) => i.affiliateProductId);
  const rows = await AffiliateProduct.findAll({
    where: { id: ids },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  const rowMap = new Map(rows.map((r) => [r.id, r]));

  const updated = [];
  for (const item of items) {
    const ap = rowMap.get(item.affiliateProductId);
    if (!ap) {
      throw Object.assign(new Error(`Affiliate product ${item.affiliateProductId} not found`), {
        statusCode: 404,
      });
    }
    ap.quantity += item.quantity;
    await ap.save({ transaction });
    updated.push(ap);
  }

  return updated;
}

module.exports = {
  decrementStock,
  restoreStock,
  decrementStockBatch,
  restoreStockBatch,
  InsufficientStockError,
};