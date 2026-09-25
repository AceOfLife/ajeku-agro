const { Op, fn, col, literal } = require('sequelize');
const { Sale, Payment, Product } = require('../models');

/**
 * Build a WHERE clause scoped to the caller's role.
 */
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
  // workers don't see payments
  return null;
}

/**
 * Summary card metrics.
 */
async function summary(user, query) {
  const where = scopeWhere(user, query);

  const completedWhere = { ...where, status: 'completed' };
  const pendingWhere = { ...where, status: 'pending' };

  const [completedAgg] = await Sale.findAll({
    where: completedWhere,
    attributes: [
      [fn('COALESCE', fn('SUM', col('gross_amount')), 0), 'gross'],
      [fn('COALESCE', fn('SUM', col('commission_amount')), 0), 'commission'],
      [fn('COUNT', col('id')), 'count'],
    ],
    raw: true,
  });

  const [pendingAgg] = await Sale.findAll({
    where: pendingWhere,
    attributes: [
      [fn('COALESCE', fn('SUM', col('commission_amount')), 0), 'commission'],
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
 * Sales by product.
 */
async function byProduct(user, query) {
  const where = scopeWhere(user, query);
  where.status = 'completed';

  const rows = await Sale.findAll({
    where,
    attributes: [
      'productId',
      [fn('COUNT', col('Sale.id')), 'orders'],
      [fn('COALESCE', fn('SUM', col('gross_amount')), 0), 'gross'],
      [fn('COALESCE', fn('SUM', col('commission_amount')), 0), 'commission'],
    ],
    include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'description'] }],
    group: ['Sale.product_id', 'product.id'],
    order: [[literal('gross'), 'DESC']],
    raw: false,
  });

  return rows.map((r) => ({
    productId: r.productId,
    product: r.product
      ? { id: r.product.id, name: r.product.name, description: r.product.description }
      : null,
    orders: Number(r.get('orders')),
    grossSales: Number(r.get('gross')),
    commission: Number(r.get('commission')),
  }));
}

/**
 * Revenue over time — one row per day.
 */
async function timeline(user, query) {
  const where = scopeWhere(user, query);
  where.status = 'completed';

  const rows = await Sale.findAll({
    where,
    attributes: [
      [fn('DATE', col('created_at')), 'day'],
      [fn('COALESCE', fn('SUM', col('gross_amount')), 0), 'gross'],
      [fn('COALESCE', fn('SUM', col('commission_amount')), 0), 'commission'],
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
 * Ledger — paginated sale rows.
 */
async function ledger(user, query) {
  const where = scopeWhere(user, query);

  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  const { rows, count } = await Sale.findAndCountAll({
    where,
    include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    items: rows.map((s) => ({
      id: s.id,
      ref: s.ref,
      product: s.product ? { id: s.product.id, name: s.product.name } : null,
      quantity: s.quantity,
      grossAmount: Number(s.grossAmount),
      commissionAmount: Number(s.commissionAmount),
      status: s.status,
      date: s.createdAt,
    })),
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
  };
}

/**
 * Payments list for the affiliate.
 */
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

/**
 * One-shot overview (for initial dashboard load).
 */
async function overview(user, query) {
  const [summaryData, byProductData, timelineData, ledgerData, paymentsData] =
    await Promise.all([
      summary(user, query),
      byProduct(user, query),
      timeline(user, query),
      ledger(user, { ...query, limit: 5 }), // small ledger preview
      payments(user, { ...query, limit: 5 }), // small payments preview
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