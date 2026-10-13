const { Op, fn, col } = require('sequelize');
const { Verification, User } = require('../models');
const { ok, fail } = require('../utils/response');
const {
  ensureAffiliateQr,
  getAffiliateQr,
  findAffiliateByQrToken,
} = require('../services/qr.service');

const serializeVerification = (v) => ({
  id: v.id,
  affiliateId: v.affiliateId,
  name: v.name,
  email: v.email,
  scanCount: v.scanCount,
  firstSeenAt: v.firstSeenAt,
  lastSeenAt: v.lastSeenAt,
  createdAt: v.createdAt,
  updatedAt: v.updatedAt,
});

// ===============================================================
// QR endpoints
// ===============================================================

// POST /api/affiliate/admin/affiliates/:id/qr   (admin) — idempotent create
exports.generateAffiliateQr = async (req, res) => {
  try {
    const data = await ensureAffiliateQr(req.params.id);
    return ok(res, data, 'QR ready');
  } catch (err) {
    if (err.statusCode) return fail(res, err.message, err.statusCode);
    console.error('[qr] generateAffiliateQr error:', err);
    return fail(res, 'Could not generate QR', 500);
  }
};

// GET /api/affiliate/my-qr   (affiliate, worker) — parent affiliate's QR
exports.getMyQr = async (req, res) => {
  const affiliateId =
    req.user.role === 'worker' ? req.user.parentAffiliateId : req.user.id;
  if (!affiliateId) return fail(res, 'Could not resolve affiliate', 400);

  try {
    const data = await getAffiliateQr(affiliateId);
    return ok(res, data);
  } catch (err) {
    if (err.statusCode) return fail(res, err.message, err.statusCode);
    console.error('[qr] getMyQr error:', err);
    return fail(res, 'Could not load QR', 500);
  }
};

// GET /api/affiliate/admin/affiliates/:id/qr   (admin)
exports.adminGetAffiliateQr = async (req, res) => {
  try {
    const data = await getAffiliateQr(req.params.id);
    return ok(res, data);
  } catch (err) {
    if (err.statusCode) return fail(res, err.message, err.statusCode);
    console.error('[qr] adminGetAffiliateQr error:', err);
    return fail(res, 'Could not load QR', 500);
  }
};

// ===============================================================
// Public buyer-facing endpoints
// ===============================================================

// GET /api/affiliate/verify/:token   (public)
exports.publicGetForm = async (req, res) => {
  try {
    const affiliate = await findAffiliateByQrToken(req.params.token);
    if (!affiliate) return fail(res, 'Invalid verification link', 404);
    return ok(res, { affiliateName: affiliate.name });
  } catch (err) {
    console.error('[verify] publicGetForm error:', err);
    return fail(res, 'Could not load verification', 500);
  }
};

// POST /api/affiliate/verify/:token   (public)
exports.publicSubmitForm = async (req, res) => {
  try {
    const { token } = req.params;
    const { name, email } = req.body;

    const affiliate = await findAffiliateByQrToken(token);
    if (!affiliate) return fail(res, 'Invalid verification link', 404);

    const normalizedEmail = String(email).toLowerCase().trim();
    const safeName = String(name).trim();
    const ip =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      null;
    const userAgent = (req.headers['user-agent'] || '').slice(0, 255) || null;
    const now = new Date();

    const existing = await Verification.findOne({
      where: { affiliateId: affiliate.id, email: normalizedEmail },
    });

    if (existing) {
      existing.name = safeName;
      existing.scanCount += 1;
      existing.lastSeenAt = now;
      existing.lastIp = ip;
      existing.lastUserAgent = userAgent;
      await existing.save();
    } else {
      await Verification.create({
        affiliateId: affiliate.id,
        name: safeName,
        email: normalizedEmail,
        scanCount: 1,
        firstSeenAt: now,
        lastSeenAt: now,
        lastIp: ip,
        lastUserAgent: userAgent,
      });
    }

    return ok(
      res,
      { affiliateName: affiliate.name },
      `Thanks for buying from ${affiliate.name}`
    );
  } catch (err) {
    console.error('[verify] publicSubmitForm error:', err);
    return fail(res, 'Could not process verification', 500);
  }
};

// ===============================================================
// Affiliate dashboard
// ===============================================================

// GET /api/affiliate/dashboard/verifications   (affiliate)
exports.listMyVerifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const where = { affiliateId: req.user.id };
    if (req.query.from || req.query.to) {
      where.lastSeenAt = {};
      if (req.query.from) where.lastSeenAt[Op.gte] = new Date(req.query.from);
      if (req.query.to) where.lastSeenAt[Op.lte] = new Date(req.query.to);
    }

    const { rows, count } = await Verification.findAndCountAll({
      where,
      order: [['lastSeenAt', 'DESC']],
      limit,
      offset,
    });

    return ok(res, {
      items: rows.map(serializeVerification),
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    console.error('[verify] listMyVerifications error:', err);
    return fail(res, 'Could not load verifications', 500);
  }
};

// ===============================================================
// Admin
// ===============================================================

// GET /api/affiliate/admin/verifications   (admin)
exports.adminListVerifications = async (req, res) => {
  try {
    const { affiliateId, from, to } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const where = {};
    if (affiliateId) where.affiliateId = affiliateId;
    if (from || to) {
      where.lastSeenAt = {};
      if (from) where.lastSeenAt[Op.gte] = new Date(from);
      if (to) where.lastSeenAt[Op.lte] = new Date(to);
    }

    const { rows, count } = await Verification.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'affiliate',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
      order: [['lastSeenAt', 'DESC']],
      limit,
      offset,
    });

    return ok(res, {
      items: rows.map((v) => ({
        ...serializeVerification(v),
        affiliate: v.affiliate
          ? { id: v.affiliate.id, name: v.affiliate.name, email: v.affiliate.email }
          : null,
      })),
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    console.error('[verify] adminListVerifications error:', err);
    return fail(res, 'Could not load verifications', 500);
  }
};

// GET /api/affiliate/admin/verification-report   (admin)
exports.adminReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    const dateWhere = {};
    if (from || to) {
      dateWhere.lastSeenAt = {};
      if (from) dateWhere.lastSeenAt[Op.gte] = new Date(from);
      if (to) dateWhere.lastSeenAt[Op.lte] = new Date(to);
    }

    const rows = await Verification.findAll({
      where: dateWhere,
      attributes: [
        'affiliateId',
        [fn('COUNT', col('Verification.id')), 'uniqueBuyers'],
        [fn('COALESCE', fn('SUM', col('scan_count')), 0), 'totalScans'],
      ],
      include: [
        {
          model: User,
          as: 'affiliate',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
      group: ['Verification.affiliate_id', 'affiliate.id'],
      raw: false,
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyRows = await Verification.findAll({
      where: { lastSeenAt: { [Op.gte]: monthStart } },
      attributes: [
        'affiliateId',
        [fn('COUNT', col('Verification.id')), 'scansThisMonth'],
      ],
      group: ['affiliate_id'],
      raw: true,
    });

    const monthlyMap = new Map(
      monthlyRows.map((r) => [r.affiliateId, Number(r.scansThisMonth)])
    );

    return ok(res, {
      generatedAt: new Date().toISOString(),
      affiliates: rows.map((r) => ({
        affiliateId: r.affiliateId,
        affiliateName: r.affiliate ? r.affiliate.name : null,
        uniqueBuyers: Number(r.get('uniqueBuyers')),
        totalScans: Number(r.get('totalScans')),
        scansThisMonth: monthlyMap.get(r.affiliateId) || 0,
      })),
    });
  } catch (err) {
    console.error('[verify] adminReport error:', err);
    return fail(res, 'Could not generate report', 500);
  }
};