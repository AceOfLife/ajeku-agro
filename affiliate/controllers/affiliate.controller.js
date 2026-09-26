const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { ok, fail } = require('../utils/response');

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  affiliateId: u.parentAffiliateId,
  isActive: u.isActive,
  createdAt: u.createdAt,
});

// POST /api/affiliate/admin/affiliates  (admin only)
exports.createAffiliate = async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ where: { email: email.toLowerCase() } });
  if (exists) return fail(res, 'Email already in use', 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'affiliate',
    parentAffiliateId: null,
  });
  return ok(res, publicUser(user), 'Affiliate created', 201);
};

// GET /api/affiliate/admin/affiliates  (admin only)
// GET /api/affiliate/admin/affiliates?include=workers&affiliateId=<uuid>
// GET /api/affiliate/admin/affiliates?include=workers,balance&affiliateId=<uuid>
exports.listAffiliates = async (req, res) => {
  const includeParam = (req.query.include || '').split(',').map((s) => s.trim());
  const includeWorkers = includeParam.includes('workers');
  const includeBalance = includeParam.includes('balance');
  const { affiliateId } = req.query;

  const where = { role: 'affiliate' };
  if (affiliateId) where.id = affiliateId;

  const affiliates = await User.findAll({
    where,
    order: [['createdAt', 'DESC']],
    include: includeWorkers
      ? [
          {
            model: User,
            as: 'workers',
            attributes: ['id', 'name', 'email', 'isActive', 'createdAt'],
            required: false,
          },
        ]
      : [],
  });

  let balanceMap = new Map();
  if (includeBalance) {
    const ids = affiliates.map((a) => a.id);
    const { getBalancesForAffiliates } = require('../services/balance.service');
    balanceMap = await getBalancesForAffiliates(ids);
  }

  const data = affiliates.map((a) => {
    const base = publicUser(a);
    if (includeWorkers) {
      base.workers = (a.workers || []).map((w) => ({
        id: w.id,
        name: w.name,
        email: w.email,
        role: 'worker',
        affiliateId: a.id,
        isActive: w.isActive,
        createdAt: w.createdAt,
      }));
    }
    if (includeBalance) {
      base.balance = balanceMap.get(a.id) || {
        commissionEarned: 0,
        completedSalesCount: 0,
        paidManually: 0,
        outstandingBalance: 0,
        pendingCommission: 0,
        pendingSalesCount: 0,
      };
    }
    return base;
  });

  return ok(res, data);
};

// POST /api/affiliate/affiliates/workers  (affiliate only)
exports.createWorker = async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ where: { email: email.toLowerCase() } });
  if (exists) return fail(res, 'Email already in use', 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const worker = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'worker',
    parentAffiliateId: req.user.id,
  });
  return ok(res, publicUser(worker), 'Worker created', 201);
};

// GET /api/affiliate/affiliates/workers  (affiliate only)
exports.listWorkers = async (req, res) => {
  const list = await User.findAll({
    where: { role: 'worker', parentAffiliateId: req.user.id },
    order: [['createdAt', 'DESC']],
  });
  return ok(res, list.map(publicUser));
};

// PATCH /api/affiliate/affiliates/workers/:id/toggle  (affiliate only)
exports.toggleWorker = async (req, res) => {
  const worker = await User.findOne({
    where: { id: req.params.id, role: 'worker', parentAffiliateId: req.user.id },
  });
  if (!worker) return fail(res, 'Worker not found', 404);
  worker.isActive = !worker.isActive;
  await worker.save();
  return ok(res, publicUser(worker), `Worker ${worker.isActive ? 'activated' : 'deactivated'}`);
};

// GET /api/affiliate/admin/affiliates/:id/balance   (admin only)
exports.getAffiliateBalance = async (req, res) => {
  const { getAffiliateBalance } = require('../services/balance.service');
  const data = await getAffiliateBalance(req.params.id);
  if (!data) return fail(res, 'Affiliate not found', 404);
  return ok(res, data);
};