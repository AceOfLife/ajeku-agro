const { Product } = require('../models');

class InsufficientStockError extends Error {
  constructor(productId, available, requested) {
    super(`Insufficient stock for product ${name}: have ${available}, need ${requested}`);
    this.name = 'InsufficientStockError';
    this.statusCode = 400;
  }
}

async function decrementStock(productId, quantity, { transaction } = {}) {
  if (quantity <= 0) throw new Error('Quantity must be positive');

  const product = await Product.findByPk(productId, {
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 });

  if (product.quantity < quantity) {
    throw new InsufficientStockError(productId, product.quantity, quantity);
  }

  product.quantity -= quantity;
  await product.save({ transaction });
  return product;
}

async function restoreStock(productId, quantity, { transaction } = {}) {
  if (quantity <= 0) throw new Error('Quantity must be positive');

  const product = await Product.findByPk(productId, {
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 });

  product.quantity += quantity;
  await product.save({ transaction });
  return product;
}

module.exports = {
  decrementStock,
  restoreStock,
  InsufficientStockError,
};