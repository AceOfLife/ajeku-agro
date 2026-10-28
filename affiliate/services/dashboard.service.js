const { Op, fn, col, literal } = require('sequelize');
const { Sale, SaleItem, Payment, AffiliateProduct, Product } = require('../models');

function scopeWhere(user, query) {
  const where = {};

  if (user.role === 'admin') {
    if (query.affiliateId) where.affiliateId = query.affiliateId;
  } else if (user.role === 'affiliate') {
    where.affiliateId = user.id;
  } else if (user.role === 'worker') {
    where.loggedByUserId = user.id;
  }

  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt[Op.gte] = new Date(query.from);
    if (query.to) where.createdAt[Op.lte] = new Date(query.to);
  }

  return where;
}

function paymentScope(user, query) {
  if (user.role === 'admin') {
    return query.affiliateId ? { affiliateId: query.affiliateId } : {};
  }
  if (user.role === 'affiliate') {
    return { affiliateId: user.id };
  }
  return null;
}

/**
 * Summary — now uses Sale.totalGross / Sale.totalCommission.
 */
async function summary(user, query) {
  const where = scopeWhere(user, query);

  const completedWhere = { ...where, status: 'completed' };
  const pendingWhere = { ...where, status: 'pending' };

  const [completedAgg] = await Sale.findAll({
    where: completedWhere,
    attributes: [
      [fn('COALESCE', fn('SUM', col('total_gross')), 0), 'gross'],
      [fn('COALESCE', fn('SUM', col('total_commission')), 0), 'commission'],
      [fn('COUNT', col('id')), 'count'],
    ],
    raw: true,
  });

  const [pendingAgg] = await Sale.findAll({
    where: pendingWhere,
    attributes: [
      [fn('COALESCE', fn('SUM', col('total_commission')), 0), 'commission'],
      [fn('COUNT', col('id')), 'count'],
    ],
    raw: true,
  });

  const payScope = paymentScope(user, query);
  let paid = 0;
  if (payScope) {
    const [paidAgg] = await Payment.findAll({
      where: { ...payScope, status: 'paid' },
      attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
      raw: true,
    });
    paid = Number(paidAgg.total);
  }

  const gross = Number(completedAgg.gross);
  const commissionEarned = Number(completedAgg.commission);
  const pendingCommission = Number(pendingAgg.commission);
  const outstanding = +(commissionEarned - paid).toFixed(2);

  return {
    grossSales: gross,
    completedSalesCount: Number(completedAgg.count),
    commissionEarned,
    paidManually: paid,
    outstandingBalance: outstanding,
    pendingCommission,
    pendingSalesCount: Number(pendingAgg.count),
  };
}

/**
 * Sales by product — now aggregates from sale_items.
 */
async function byProduct(user, query) {
  const where = scopeWhere(user, query);
  where.status = 'completed';

  const rows = await SaleItem.findAll({
    attributes: [
      'affiliateProductId',
      [fn('COUNT', col('SaleItem.id')), 'orders'],
      [fn('COALESCE', fn('SUM', col('SaleItem.gross_amount')), 0), 'gross'],
      [fn('COALESCE', fn('SUM', col('SaleItem.commission_amount')), 0), 'commission'],
    ],
    include: [
      {
        model: AffiliateProduct,
        as: 'affiliateProduct',
        attributes: ['id', 'commissionPercent'],
        include: [
          { model: Product, as: 'product', attributes: ['id', 'name', 'description'] },
        ],
      },
      {
        model: Sale,
        as: 'sale',
        attributes: [],
        where,
        required: true,
      },
    ],
    group: [
      'SaleItem.affiliate_product_id',
      'affiliateProduct.id',
      'affiliateProduct->product.id',
    ],
    order: [[literal('gross'), 'DESC']],
    raw: false,
  });

  return rows.map((r) => ({
    affiliateProductId: r.affiliateProductId,
    product: r.affiliateProduct?.product
      ? {
          id: r.affiliateProduct.product.id,
          name: r.affiliateProduct.product.name,
          description: r.affiliateProduct.product.description,
        }
      : null,
    orders: Number(r.get('orders')),
    grossSales: Number(r.get('gross')),
    commission: Number(r.get('commission')),
  }));
}

/**
 * Revenue over time — one row per day (sale-level totals).
 */
async function timeline(user, query) {
  const where = scopeWhere(user, query);
  where.status = 'completed';

  const rows = await Sale.findAll({
    where,
    attributes: [
      [fn('DATE', col('created_at')), 'day'],
      [fn('COALESCE', fn('SUM', col('total_gross')), 0), 'gross'],
      [fn('COALESCE', fn('SUM', col('total_commission')), 0), 'commission'],
    ],
    group: [fn('DATE', col('created_at'))],
    order: [[literal('day'), 'ASC']],
    raw: true,
  });

  return rows.map((r) => ({
    date: r.day,
    grossSales: Number(r.gross),
    commission: Number(r.commission),
  }));
}

/**
 * Ledger — paginated sale rows with item count.
 */
async function ledger(user, query) {
  const where = scopeWhere(user, query);

  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  const { rows, count } = await Sale.findAndCountAll({
    where,
    include: [
      {
        model: SaleItem,
        as: 'items',
        attributes: ['id', 'quantity', 'grossAmount', 'commissionAmount'],
        required: false,
        include: [
          {
            model: AffiliateProduct,
            as: 'affiliateProduct',
            attributes: ['id'],
            required: false,
            include: [
              { model: Product, as: 'product', attributes: ['id', 'name'], required: false },
            ],
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    distinct: true,
  });

  return {
    items: rows.map((s) => ({
      id: s.id,
      ref: s.ref,
      totalGross: Number(s.totalGross),
      totalCommission: Number(s.totalCommission),
      status: s.status,
      date: s.createdAt,
      itemCount: Array.isArray(s.items) ? s.items.length : 0,
      items: Array.isArray(s.items)
        ? s.items.map((it) => ({
            productName: it.affiliateProduct?.product?.name || null,
            quantity: it.quantity,
            grossAmount: Number(it.grossAmount),
            commissionAmount: Number(it.commissionAmount),
          }))
        : [],
    })),
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
  };
}

async function payments(user, query) {
  const scope = paymentScope(user, query);
  if (!scope) return { items: [], pagination: { page: 1, limit: 0, total: 0, pages: 0 } };

  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  const where = { ...scope };
  if (query.from || query.to) {
    where.paidOn = {};
    if (query.from) where.paidOn[Op.gte] = query.from;
    if (query.to) where.paidOn[Op.lte] = query.to;
  }

  const { rows, count } = await Payment.findAndCountAll({
    where,
    order: [['paidOn', 'DESC']],
    limit,
    offset,
  });

  return {
    items: rows.map((p) => ({
      id: p.id,
      ref: p.ref,
      amount: Number(p.amount),
      paidOn: p.paidOn,
      status: p.status,
      note: p.note,
    })),
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
  };
}

async function overview(user, query) {
  const [summaryData, byProductData, timelineData, ledgerData, paymentsData] =
    await Promise.all([
      summary(user, query),
      byProduct(user, query),
      timeline(user, query),
      ledger(user, { ...query, limit: 5 }),
      payments(user, { ...query, limit: 5 }),
    ]);

  return {
    summary: summaryData,
    byProduct: byProductData,
    timeline: timelineData,
    ledger: ledgerData,
    payments: paymentsData,
  };
}

module.exports = { summary, byProduct, timeline, ledger, payments, overview };