const { Op } = require('sequelize');
const { sequelize, Sale, Product, User } = require('../models');
const { ok, fail } = require('../utils/response');
const { saleRef } = require('../utils/refs');
const { decrementStock, restoreStock } = require('../services/stock.service');

const serialize = (s) => ({
  id: s.id,
  ref: s.ref,
  productId: s.productId,
  product: s.product
    ? { id: s.product.id, name: s.product.name }
    : undefined,
  affiliateId: s.affiliateId,
  loggedByUserId: s.loggedByUserId,
  quantity: s.quantity,
  unitPrice: Number(s.unitPrice),
  grossAmount: Number(s.grossAmount),
  commissionPercent: Number(s.commissionPercent),
  commissionAmount: Number(s.commissionAmount),
  status: s.status,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

// POST /api/affiliate/sales   (affiliate or worker)
exports.createSale = async (req, res) => {
  const { productId, quantity } = req.body;
  const qty = parseInt(quantity, 10);

  // Resolve affiliate (worker → parent; affiliate → self)
  const affiliateId =
    req.user.role === 'worker' ? req.user.parentAffiliateId : req.user.id;

  if (!affiliateId) {
    return fail(res, 'Could not resolve affiliate for this user', 400);
  }

  const product = await Product.findByPk(productId);
  if (!product || !product.isActive) {
    return fail(res, 'Product not found or inactive', 404);
  }

  const unitPrice = Number(product.price);
  const commissionPercent = Number(product.commissionPercent);
  const grossAmount = +(unitPrice * qty).toFixed(2);
  const commissionAmount = +((grossAmount * commissionPercent) / 100).toFixed(2);

  // Atomic: decrement stock + create sale in one transaction
  const t = await sequelize.transaction();
  try {
    await decrementStock(productId, qty, { transaction: t });

    const sale = await Sale.create(
      {
        ref: saleRef(),
        productId,
        affiliateId,
        loggedByUserId: req.user.id,
        quantity: qty,
        unitPrice,
        grossAmount,
        commissionPercent,
        commissionAmount,
        status: 'pending',
      },
      { transaction: t }
    );

    await t.commit();

    // reload with product for the response
    await sale.reload({ include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }] });
    return ok(res, serialize(sale), 'Sale logged', 201);
  } catch (err) {
    await t.rollback();
    if (err.name === 'InsufficientStockError') {
      return fail(res, err.message, 400);
    }
    throw err;
  }
};

// GET /api/affiliate/sales
// - admin: all sales, optional filters (affiliateId, status, productId, from, to)
// - affiliate: own sales (affiliateId = self)
// - worker: own logged sales (loggedByUserId = self), plus optionally their parent's sales? -> no, only own
exports.listSales = async (req, res) => {
  const { status, productId, affiliateId, from, to } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  const where = {};

  if (req.user.role === 'admin') {
    if (affiliateId) where.affiliateId = affiliateId;
  } else if (req.user.role === 'affiliate') {
    where.affiliateId = req.user.id;
  } else if (req.user.role === 'worker') {
    where.loggedByUserId = req.user.id;
  }

  if (status) where.status = status;
  if (productId) where.productId = productId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(from);
    if (to) where.createdAt[Op.lte] = new Date(to);
  }

  const { rows, count } = await Sale.findAndCountAll({
    where,
    include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return ok(res, {
    items: rows.map(serialize),
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
  });
};

// GET /api/affiliate/sales/:id
exports.getSale = async (req, res) => {
  const sale = await Sale.findByPk(req.params.id, {
    include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
  });
  if (!sale) return fail(res, 'Sale not found', 404);

  const allowed =
    req.user.role === 'admin' ||
    (req.user.role === 'affiliate' && sale.affiliateId === req.user.id) ||
    (req.user.role === 'worker' && sale.loggedByUserId === req.user.id);

  if (!allowed) return fail(res, 'Forbidden', 403);

  return ok(res, serialize(sale));
};

// PATCH /api/affiliate/sales/:id/status   (affiliate or worker, own sales)
exports.updateStatus = async (req, res) => {
  const { status } = req.body;

  const sale = await Sale.findByPk(req.params.id);
  if (!sale) return fail(res, 'Sale not found', 404);

  const owns =
    (req.user.role === 'affiliate' && sale.affiliateId === req.user.id) ||
    (req.user.role === 'worker' && sale.loggedByUserId === req.user.id);

  if (!owns) return fail(res, 'Forbidden', 403);

  if (sale.status === status) {
    return ok(res, serialize(sale), `Sale already ${status}`);
  }

  // Guard transitions
  if (sale.status === 'refunded') {
    return fail(res, 'Refunded sales cannot change status', 400);
  }

  if (status === 'refunded') {
    const t = await sequelize.transaction();
    try {
      await restoreStock(sale.productId, sale.quantity, { transaction: t });
      sale.status = 'refunded';
      await sale.save({ transaction: t });
      await t.commit();
      return ok(res, serialize(sale), 'Sale refunded; stock restored');
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  if (status === 'completed') {
    sale.status = 'completed';
    await sale.save();
    return ok(res, serialize(sale), 'Sale completed');
  }

  return fail(res, 'Unsupported status transition', 400);
};