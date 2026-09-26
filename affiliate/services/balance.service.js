const { Op, fn, col } = require('sequelize');
const { Sale, Payment, User } = require('../models');

/**
 * Compute balance figures for one affiliate.
 * Returns null if the affiliate doesn't exist.
 */
async function getAffiliateBalance(affiliateId) {
  const affiliate = await User.findOne({
    where: { id: affiliateId, role: 'affiliate' },
    attributes: ['id', 'name', 'email', 'isActive', 'createdAt'],
  });
  if (!affiliate) return null;

  const [completedAgg] = await Sale.findAll({
    where: { affiliateId, status: 'completed' },
    attributes: [
      [fn('COALESCE', fn('SUM', col('gross_amount')), 0), 'gross'],
      [fn('COALESCE', fn('SUM', col('commission_amount')), 0), 'commission'],
      [fn('COUNT', col('id')), 'count'],
    ],
    raw: true,
  });

  const [pendingAgg] = await Sale.findAll({
    where: { affiliateId, status: 'pending' },
    attributes: [
      [fn('COALESCE', fn('SUM', col('commission_amount')), 0), 'commission'],
      [fn('COUNT', col('id')), 'count'],
    ],
    raw: true,
  });

  const [paidAgg] = await Payment.findAll({
    where: { affiliateId, status: 'paid' },
    attributes: [
      [fn('COALESCE', fn('SUM', col('amount')), 0), 'total'],
      [fn('MAX', col('paid_on')), 'lastPaidOn'],
    ],
    raw: true,
  });

  const commissionEarned = Number(completedAgg.commission);
  const pendingCommission = Number(pendingAgg.commission);
  const paidManually = Number(paidAgg.total);
  const outstandingBalance = +(commissionEarned - paidManually).toFixed(2);

  return {
    affiliate: {
      id: affiliate.id,
      name: affiliate.name,
      email: affiliate.email,
      isActive: affiliate.isActive,
      createdAt: affiliate.createdAt,
    },
    grossSales: Number(completedAgg.gross),
    completedSalesCount: Number(completedAgg.count),
    commissionEarned,
    paidManually,
    outstandingBalance,
    pendingCommission,
    pendingSalesCount: Number(pendingAgg.count),
    lastPaidOn: paidAgg.lastPaidOn || null,
    currency: 'NGN',
  };
}

/**
 * Bulk version for the affiliate list.
 * Returns a Map keyed by affiliate id.
 */
async function getBalancesForAffiliates(affiliateIds) {
  if (!affiliateIds.length) return new Map();

  const completed = await Sale.findAll({
    where: { affiliateId: { [Op.in]: affiliateIds }, status: 'completed' },
    attributes: [
      'affiliateId',
      [fn('COALESCE', fn('SUM', col('commission_amount')), 0), 'commission'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['affiliate_id'],
    raw: true,
  });

  const pending = await Sale.findAll({
    where: { affiliateId: { [Op.in]: affiliateIds }, status: 'pending' },
    attributes: [
      'affiliateId',
      [fn('COALESCE', fn('SUM', col('commission_amount')), 0), 'commission'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['affiliate_id'],
    raw: true,
  });

  const paid = await Payment.findAll({
    where: { affiliateId: { [Op.in]: affiliateIds }, status: 'paid' },
    attributes: [
      'affiliateId',
      [fn('COALESCE', fn('SUM', col('amount')), 0), 'total'],
    ],
    group: ['affiliate_id'],
    raw: true,
  });

  const map = new Map();
  affiliateIds.forEach((id) =>
    map.set(id, {
      commissionEarned: 0,
      completedSalesCount: 0,
      paidManually: 0,
      outstandingBalance: 0,
      pendingCommission: 0,
      pendingSalesCount: 0,
    })
  );

  completed.forEach((r) => {
    const b = map.get(r.affiliateId);
    if (!b) return;
    b.commissionEarned = Number(r.commission);
    b.completedSalesCount = Number(r.count);
  });
  pending.forEach((r) => {
    const b = map.get(r.affiliateId);
    if (!b) return;
    b.pendingCommission = Number(r.commission);
    b.pendingSalesCount = Number(r.count);
  });
  paid.forEach((r) => {
    const b = map.get(r.affiliateId);
    if (!b) return;
    b.paidManually = Number(r.total);
  });

  map.forEach((b) => {
    b.outstandingBalance = +(b.commissionEarned - b.paidManually).toFixed(2);
  });

  return map;
}

module.exports = { getAffiliateBalance, getBalancesForAffiliates };