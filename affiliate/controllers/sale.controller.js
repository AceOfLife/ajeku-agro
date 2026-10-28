const { Op } = require('sequelize');
const { sequelize, Sale, SaleItem, AffiliateProduct, Product, User } = require('../models');
const { ok, fail } = require('../utils/response');
const { saleRef } = require('../utils/refs');
const {
  decrementStockBatch,
  restoreStockBatch,
} = require('../services/stock.service');
const { ensureSaleVerificationToken } = require('../services/saleQr.service');

const serializeItem = (item) => ({
  id: item.id,
  affiliateProductId: item.affiliateProductId,
  quantity: item.quantity,
  unitPrice: Number(item.unitPrice),
  grossAmount: Number(item.grossAmount),
  commissionPercent: Number(item.commissionPercent),
  commissionAmount: Number(item.commissionAmount),
  product: item.affiliateProduct?.product
    ? {
        id: item.affiliateProduct.product.id,
        name: item.affiliateProduct.product.name,
      }
    : null,
});

const serialize = (s) => ({
  id: s.id,
  ref: s.ref,
  affiliateId: s.affiliateId,
  loggedByUserId: s.loggedByUserId,
  totalGross: Number(s.totalGross),
  totalCommission: Number(s.totalCommission),
  status: s.status,
  verificationToken: s.verificationToken || null,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
  items: Array.isArray(s.items) ? s.items.map(serializeItem) : [],
});

const fullInclude = [
  {
    model: SaleItem,
    as: 'items',
    include: [
      {
        model: AffiliateProduct,
        as: 'affiliateProduct',
        include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
      },
    ],
  },
];

// POST /api/affiliate/sales   (affiliate or worker)
// Body: { items: [{ affiliateProductId, quantity }, ...] }
exports.createSale = async (req, res) => {
  const { items } = req.body;

  const affiliateId =
    req.user.role === 'worker' ? req.user.parentAffiliateId : req.user.id;
  if (!affiliateId) {
    return fail(res, 'Could not resolve affiliate for this user', 400);
  }

  // 1. Fetch all affiliate products referenced by the items
  const ids = items.map((i) => i.affiliateProductId);
  const aps = await AffiliateProduct.findAll({
    where: { id: { [Op.in]: ids } },
    include: [{ model: Product, as: 'product' }],
  });
  const apMap = new Map(aps.map((ap) => [ap.id, ap]));

  // 2. Validate every item belongs to this affiliate and is active
  for (const item of items) {
    const ap = apMap.get(item.affiliateProductId);
    if (!ap || !ap.isActive) {
      return fail(
        res,
        `Affiliate product ${item.affiliateProductId} not found or inactive`,
        404
      );
    }
    if (ap.affiliateId !== affiliateId) {
      return fail(
        res,
        `Forbidden: product ${item.affiliateProductId} not assigned to this affiliate`,
        403
      );
    }
  }

  // 3. Compute line totals + sale totals
  let totalGross = 0;
  let totalCommission = 0;
  const itemData = items.map((item) => {
    const ap = apMap.get(item.affiliateProductId);
    const quantity = parseInt(item.quantity, 10);
    const unitPrice = Number(ap.product.price);
    const commissionPercent = Number(ap.commissionPercent);
    const grossAmount = +(unitPrice * quantity).toFixed(2);
    const commissionAmount = +((grossAmount * commissionPercent) / 100).toFixed(2);
    totalGross += grossAmount;
    totalCommission += commissionAmount;
    return {
      affiliateProductId: item.affiliateProductId,
      quantity,
      unitPrice,
      grossAmount,
      commissionPercent,
      commissionAmount,
    };
  });

  totalGross = +totalGross.toFixed(2);
  totalCommission = +totalCommission.toFixed(2);

  // 4. Atomic: decrement stock for all items + create sale + items
  const t = await sequelize.transaction();
  try {
    await decrementStockBatch(
      items.map((i) => ({
        affiliateProductId: i.affiliateProductId,
        quantity: parseInt(i.quantity, 10),
      })),
      { transaction: t }
    );

    const sale = await Sale.create(
      {
        ref: saleRef(),
        affiliateId,
        loggedByUserId: req.user.id,
        totalGross,
        totalCommission,
        status: 'pending',
      },
      { transaction: t }
    );

    await SaleItem.bulkCreate(
      itemData.map((d) => ({ ...d, saleId: sale.id })),
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
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(from);
    if (to) where.createdAt[Op.lte] = new Date(to);
  }

  // If item-level filters are present, require matching items
  const itemWhere = {};
  if (affiliateProductId) itemWhere.affiliateProductId = affiliateProductId;

  const itemInclude = {
    model: SaleItem,
    as: 'items',
    required: !!(affiliateProductId || productId),
    where: affiliateProductId ? itemWhere : undefined,
    include: [
      {
        model: AffiliateProduct,
        as: 'affiliateProduct',
        where: productId ? { productId } : undefined,
        required: !!productId,
        include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
      },
    ],
  };

  const { rows, count } = await Sale.findAndCountAll({
    where,
    include: [itemInclude],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    distinct: true,
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

  const sale = await Sale.findByPk(req.params.id, { include: fullInclude });
  if (!sale) return fail(res, 'Sale not found', 404);

  const owns =
    (req.user.role === 'affiliate' && sale.affiliateId === req.user.id) ||
    (req.user.role === 'worker' && sale.loggedByUserId === req.user.id);
  if (!owns) return fail(res, 'Forbidden', 403);

  if (sale.status === status) {
    if (status === 'completed' && sale.verificationToken) {
      const token = await ensureSaleVerificationToken(sale.id);
      return ok(
        res,
        { ...serialize(sale), verificationUrl: token.verificationUrl },
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
      const items = (sale.items || []).map((it) => ({
        affiliateProductId: it.affiliateProductId,
        quantity: it.quantity,
      }));
      await restoreStockBatch(items, { transaction: t });
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
    const tokenInfo = await ensureSaleVerificationToken(sale.id);
    sale.status = 'completed';
    await sale.save();
    await sale.reload({ include: fullInclude });

    return ok(
      res,
      { ...serialize(sale), verificationUrl: tokenInfo.verificationUrl },
      'Sale completed'
    );
  }

  return fail(res, 'Unsupported status transition', 400);
};