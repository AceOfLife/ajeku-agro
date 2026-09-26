const { Op } = require('sequelize');
const { Payment, User } = require('../models');
const { ok, fail } = require('../utils/response');
const { paymentRef } = require('../utils/refs');
const { getAffiliateBalance } = require('../services/balance.service');

const serialize = (p) => ({
  id: p.id,
  ref: p.ref,
  affiliateId: p.affiliateId,
  amount: Number(p.amount),
  paidOn: p.paidOn,
  status: p.status,
  paymentMethod: p.paymentMethod,
  note: p.note,
  createdBy: p.createdBy,
  updatedBy: p.updatedBy,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
  deletedAt: p.deletedAt,
});

// ---------------------------------------------------------------
// ADMIN
// ---------------------------------------------------------------

// POST /api/affiliate/admin/payments   (admin)
exports.adminCreatePayment = async (req, res) => {
  const { affiliateId, amount, paidOn, paymentMethod, note, status } = req.body;

  const affiliate = await User.findOne({
    where: { id: affiliateId, role: 'affiliate' },
  });
  if (!affiliate) return fail(res, 'Affiliate not found', 404);

  // Hard cap: cannot pay more than the current outstanding balance
  const balance = await getAffiliateBalance(affiliateId);
  const outstanding = balance ? balance.outstandingBalance : 0;
  const requested = Number(amount);

  if (requested > outstanding) {
    return fail(
      res,
      `Payment amount (₦${requested.toLocaleString()}) exceeds outstanding balance (₦${outstanding.toLocaleString()})`,
      400
    );
  }

  const payment = await Payment.create({
    ref: paymentRef(new Date(paidOn)),
    affiliateId,
    amount: requested,
    paidOn,
    status: status || 'paid',
    paymentMethod: paymentMethod || null,
    note: note || null,
    createdBy: req.user.id,
  });

  return ok(res, serialize(payment), 'Payment recorded', 201);
};

// GET /api/affiliate/admin/payments   (admin)
exports.adminListPayments = async (req, res) => {
  const { affiliateId, from, to, includeDeleted } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  const where = {};
  if (affiliateId) where.affiliateId = affiliateId;
  if (from || to) {
    where.paidOn = {};
    if (from) where.paidOn[Op.gte] = from;
    if (to) where.paidOn[Op.lte] = to;
  }

  const { rows, count } = await Payment.findAndCountAll({
    where,
    order: [['paidOn', 'DESC']],
    limit,
    offset,
    paranoid: includeDeleted !== 'true',
  });

  return ok(res, {
    items: rows.map(serialize),
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
  });
};

// GET /api/affiliate/admin/payments/:id
exports.adminGetPayment = async (req, res) => {
  const payment = await Payment.findByPk(req.params.id, { paranoid: false });
  if (!payment) return fail(res, 'Payment not found', 404);
  return ok(res, serialize(payment));
};

// PATCH /api/affiliate/admin/payments/:id   (admin)
exports.adminUpdatePayment = async (req, res) => {
  const payment = await Payment.findByPk(req.params.id);
  if (!payment) return fail(res, 'Payment not found', 404);

  const { amount, paidOn, paymentMethod, note, status } = req.body;
  if (amount !== undefined) payment.amount = amount;
  if (paidOn !== undefined) payment.paidOn = paidOn;
  if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
  if (note !== undefined) payment.note = note;
  if (status !== undefined) payment.status = status;
  payment.updatedBy = req.user.id;

  await payment.save();
  return ok(res, serialize(payment), 'Payment updated');
};

// DELETE /api/affiliate/admin/payments/:id   (admin, soft delete)
exports.adminDeletePayment = async (req, res) => {
  const payment = await Payment.findByPk(req.params.id);
  if (!payment) return fail(res, 'Payment not found', 404);

  payment.deletedBy = req.user.id;
  await payment.save();
  await payment.destroy(); // paranoid → sets deleted_at

  return ok(res, null, 'Payment deleted');
};

// POST /api/affiliate/admin/payments/:id/restore   (admin)
exports.adminRestorePayment = async (req, res) => {
  const payment = await Payment.findByPk(req.params.id, { paranoid: false });
  if (!payment) return fail(res, 'Payment not found', 404);
  if (!payment.deletedAt) return fail(res, 'Payment is not deleted', 400);

  await payment.restore();
  payment.deletedBy = null;
  payment.updatedBy = req.user.id;
  await payment.save();

  return ok(res, serialize(payment), 'Payment restored');
};

// ---------------------------------------------------------------
// AFFILIATE
// ---------------------------------------------------------------

// GET /api/affiliate/payments   (affiliate — own only)
exports.listMyPayments = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  const where = { affiliateId: req.user.id };
  if (req.query.from || req.query.to) {
    where.paidOn = {};
    if (req.query.from) where.paidOn[Op.gte] = req.query.from;
    if (req.query.to) where.paidOn[Op.lte] = req.query.to;
  }

  const { rows, count } = await Payment.findAndCountAll({
    where,
    order: [['paidOn', 'DESC']],
    limit,
    offset,
  });

  return ok(res, {
    items: rows.map(serialize),
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
  });
};

// GET /api/affiliate/payments/:id   (affiliate — own only)
exports.getMyPayment = async (req, res) => {
  const payment = await Payment.findOne({
    where: { id: req.params.id, affiliateId: req.user.id },
  });
  if (!payment) return fail(res, 'Payment not found', 404);
  return ok(res, serialize(payment));
};