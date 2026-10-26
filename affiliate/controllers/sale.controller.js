const { Op } = require('sequelize');
const { sequelize, Sale, AffiliateProduct, Product, User } = require('../models');
const { ok, fail } = require('../utils/response');
const { saleRef } = require('../utils/refs');
const { decrementStock, restoreStock } = require('../services/stock.service');
const { ensureSaleVerificationToken } = require('../services/saleQr.service');

const serialize = (s) => ({
  id: s.id,
  ref: s.ref,
  affiliateProductId: s.affiliateProductId,
  affiliateProduct: s.affiliateProduct
    ? {
        id: s.affiliateProduct.id,
        product: s.affiliateProduct.product
          ? {
              id: s.affiliateProduct.product.id,
              name: s.affiliateProduct.product.name,
            }
          : null,
      }
    : undefined,
  affiliateId: s.affiliateId,
  loggedByUserId: s.loggedByUserId,
  quantity: s.quantity,
  unitPrice: Number(s.unitPrice),
  grossAmount: Number(s.grossAmount),
  commissionPercent: Number(s.commissionPercent),
  commissionAmount: Number(s.commissionAmount),
  status: s.status,
  verificationToken: s.verificationToken || null,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

const fullInclude = [
  {
    model: AffiliateProduct,
    as: 'affiliateProduct',
    include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
  },
];

// POST /api/affiliate/sales   (affiliate or worker)
exports.createSale = async (req, res) => {
  const { affiliateProductId, quantity } = req.body;
  const qty = parseInt(quantity, 10);

  const affiliateId =
    req.user.role === 'worker' ? req.user.parentAffiliateId : req.user.id;
  if (!affiliateId) {
    return fail(res, 'Could not resolve affiliate for this user', 400);
  }

  const ap = await AffiliateProduct.findByPk(affiliateProductId, {
    include: [{ model: Product, as: 'product' }],
  });
  if (!ap || !ap.isActive) {
    return fail(res, 'Affiliate product not found or inactive', 404);
  }

  if (ap.affiliateId !== affiliateId) {
    return fail(res, 'Forbidden: product not assigned to this affiliate', 403);
  }

  const unitPrice = Number(ap.product.price);
  const commissionPercent = Number(ap.commissionPercent);
  const grossAmount = +(unitPrice * qty).toFixed(2);
  const commissionAmount = +((grossAmount * commissionPercent) / 100).toFixed(2);

  const t = await sequelize.transaction();
  try {
    await decrementStock(affiliateProductId, qty, { transaction: t });

    const sale = await Sale.create(
      {
        ref: saleRef(),
        affiliateProductId,
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
    await sale.reload({ include: fullInclude });
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
exports.listSales = async (req, res) => {
  const { status, affiliateProductId, productId, affiliateId, from, to } = req.query;
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
  if (affiliateProductId) where.affiliateProductId = affiliateProductId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(from);
    if (to) where.createdAt[Op.lte] = new Date(to);
  }

  const include = [...fullInclude];
  if (productId) {
    include[0].where = { productId };
    include[0].required = true;
  }

  const { rows, count } = await Sale.findAndCountAll({
    where,
    include,
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
  const sale = await Sale.findByPk(req.params.id, { include: fullInclude });
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
    // Idempotent: if already completed and has a token, return it
    if (status === 'completed' && sale.verificationToken) {
      const token = await ensureSaleVerificationToken(sale.id);
      await sale.reload({ include: fullInclude });
      return ok(
        res,
        {
          ...serialize(sale),
          verificationUrl: token.verificationUrl,
        },
        `Sale already ${status}`
      );
    }
    return ok(res, serialize(sale), `Sale already ${status}`);
  }

  if (sale.status === 'refunded') {
    return fail(res, 'Refunded sales cannot change status', 400);
  }

  if (status === 'refunded') {
    const t = await sequelize.transaction();
    try {
      await restoreStock(sale.affiliateProductId, sale.quantity, { transaction: t });
      sale.status = 'refunded';
      await sale.save({ transaction: t });
      await t.commit();
      await sale.reload({ include: fullInclude });
      return ok(res, serialize(sale), 'Sale refunded; stock restored');
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  if (status === 'completed') {
    // Generate verification token for this sale
    const tokenInfo = await ensureSaleVerificationToken(sale.id);
    sale.status = 'completed';
    await sale.save();
    await sale.reload({ include: fullInclude });

    return ok(
      res,
      {
        ...serialize(sale),
        verificationUrl: tokenInfo.verificationUrl,
      },
      'Sale completed'
    );
  }

  return fail(res, 'Unsupported status transition', 400);
};