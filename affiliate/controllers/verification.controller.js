const { Op, fn, col } = require('sequelize');
const { Verification, Buyer, Sale, User, AffiliateProduct, Product } = require('../models');
const { ok, fail } = require('../utils/response');
const crypto = require('crypto');

const serializeVerification = (v) => ({
  id: v.id,
  affiliateId: v.affiliateId,
  saleId: v.saleId,
  buyerId: v.buyerId,
  name: v.name,
  email: v.email,
  scanCount: v.scanCount,
  firstSeenAt: v.firstSeenAt,
  lastSeenAt: v.lastSeenAt,
  createdAt: v.createdAt,
  updatedAt: v.updatedAt,
});

const saleInclude = {
  model: Sale,
  as: 'sale',
  attributes: ['id', 'ref', 'quantity', 'grossAmount', 'status', 'createdAt'],
  required: false,
  include: [
    {
      model: AffiliateProduct,
      as: 'affiliateProduct',
      attributes: ['id'],
      required: false,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'description'],
          required: false,
        },
      ],
    },
  ],
};

// ===============================================================
// Public buyer-facing endpoints
// ===============================================================

// GET /api/affiliate/verify/:token   (public)
exports.publicGetForm = async (req, res) => {
  try {
    const sale = await Sale.findOne({
      where: { verificationToken: req.params.token },
      include: [
        {
          model: AffiliateProduct,
          as: 'affiliateProduct',
          attributes: ['id'],
          required: false,
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name'],
              required: false,
            },
          ],
        },
        {
          model: User,
          as: 'affiliate',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
    });
    if (!sale) return fail(res, 'Invalid verification link', 404);
    if (sale.status !== 'completed') {
      return fail(res, 'Sale not yet completed', 400);
    }

    const product = sale.affiliateProduct?.product;

    return ok(res, {
      saleRef: sale.ref,
      productName: product ? product.name : null,
      quantity: sale.quantity,
      grossAmount: Number(sale.grossAmount),
      currency: 'NGN',
      affiliateName: sale.affiliate ? sale.affiliate.name : null,
    });
  } catch (err) {
    console.error('[verify] publicGetForm error:', err);
    return fail(res, 'Could not load verification', 500);
  }
};

// POST /api/affiliate/verify/:token   (public)
// Two modes:
//   { name, email }  → first-time buyer
//   { buyerToken }   → repeat buyer (skips form)
exports.publicSubmitForm = async (req, res) => {
  try {
    const { token } = req.params;
    const { name, email, buyerToken } = req.body;

    const sale = await Sale.findOne({
      where: { verificationToken: token },
      include: [
        {
          model: AffiliateProduct,
          as: 'affiliateProduct',
          attributes: ['id'],
          required: false,
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name'],
              required: false,
            },
          ],
        },
        {
          model: User,
          as: 'affiliate',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
    });
    if (!sale) return fail(res, 'Invalid verification link', 404);
    if (sale.status !== 'completed') {
      return fail(res, 'Sale not yet completed', 400);
    }

    const now = new Date();
    const ip =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      null;
    const userAgent = (req.headers['user-agent'] || '').slice(0, 255) || null;

    let buyer = null;

    // ── Mode 1: repeat buyer via token ──────────────────────────
    if (buyerToken) {
      buyer = await Buyer.findOne({
        where: { buyerToken, affiliateId: sale.affiliateId },
      });
      if (!buyer) return fail(res, 'Invalid buyer token', 400);

      buyer.scanCount += 1;
      buyer.lastSeenAt = now;
      await buyer.save();
    }

    // ── Mode 2: first-time buyer with name/email ────────────────
    if (!buyer) {
      if (!name || !email) {
        return fail(res, 'Provide name and email, or a valid buyerToken', 400);
      }

      const normalizedEmail = String(email).toLowerCase().trim();
      const safeName = String(name).trim();

      // Find existing buyer for this affiliate, or create new
      buyer = await Buyer.findOne({
        where: { affiliateId: sale.affiliateId, email: normalizedEmail },
      });

      if (buyer) {
        // Returning buyer on a new device — update their record
        buyer.name = safeName;
        buyer.scanCount += 1;
        buyer.lastSeenAt = now;
        await buyer.save();
      } else {
        buyer = await Buyer.create({
          affiliateId: sale.affiliateId,
          name: safeName,
          email: normalizedEmail,
          buyerToken: crypto.randomUUID(),
          scanCount: 1,
          firstSeenAt: now,
          lastSeenAt: now,
        });
      }
    }

    // ── Create or update verification for this sale ─────────────
    const existingVerification = await Verification.findOne({
      where: { saleId: sale.id, buyerId: buyer.id },
    });

    if (existingVerification) {
      existingVerification.scanCount += 1;
      existingVerification.lastSeenAt = now;
      existingVerification.lastIp = ip;
      existingVerification.lastUserAgent = userAgent;
      await existingVerification.save();
    } else {
      await Verification.create({
        affiliateId: sale.affiliateId,
        saleId: sale.id,
        buyerId: buyer.id,
        name: buyer.name,
        email: buyer.email,
        scanCount: 1,
        firstSeenAt: now,
        lastSeenAt: now,
        lastIp: ip,
        lastUserAgent: userAgent,
      });
    }

    const product = sale.affiliateProduct?.product;
    const affiliateName = sale.affiliate?.name || 'the affiliate';

    return ok(
      res,
      {
        buyerToken: buyer.buyerToken,
        affiliateName: sale.affiliate?.name || null,
        productName: product ? product.name : null,
        quantity: sale.quantity,
        grossAmount: Number(sale.grossAmount),
        currency: 'NGN',
      },
      `Thanks for buying from ${affiliateName}`
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
      include: [saleInclude],
      order: [['lastSeenAt', 'DESC']],
      limit,
      offset,
    });

    return ok(res, {
      items: rows.map((v) => ({
        ...serializeVerification(v),
        sale: v.sale
          ? {
              id: v.sale.id,
              ref: v.sale.ref,
              quantity: v.sale.quantity,
              grossAmount: Number(v.sale.grossAmount),
              status: v.sale.status,
              product: v.sale.affiliateProduct?.product
                ? {
                    id: v.sale.affiliateProduct.product.id,
                    name: v.sale.affiliateProduct.product.name,
                  }
                : null,
            }
          : null,
      })),
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
        saleInclude,
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
        sale: v.sale
          ? {
              id: v.sale.id,
              ref: v.sale.ref,
              quantity: v.sale.quantity,
              grossAmount: Number(v.sale.grossAmount),
              status: v.sale.status,
              product: v.sale.affiliateProduct?.product
                ? {
                    id: v.sale.affiliateProduct.product.id,
                    name: v.sale.affiliateProduct.product.name,
                  }
                : null,
            }
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
// Per affiliate: completedSales, verifiedSales, unverifiedSales,
// verificationRate, uniqueBuyers
exports.adminReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    const completedWhere = { status: 'completed' };
    if (from || to) {
      completedWhere.createdAt = {};
      if (from) completedWhere.createdAt[Op.gte] = new Date(from);
      if (to) completedWhere.createdAt[Op.lte] = new Date(to);
    }

    // 1. Completed sales per affiliate
    const salesByAffiliate = await Sale.findAll({
      where: completedWhere,
      attributes: [
        'affiliateId',
        [fn('COUNT', col('Sale.id')), 'completedSales'],
      ],
      group: ['affiliate_id'],
      raw: true,
    });

    if (salesByAffiliate.length === 0) {
      return ok(res, { generatedAt: new Date().toISOString(), affiliates: [] });
    }

    const affiliateIds = salesByAffiliate.map((r) => r.affiliateId);

    // 2. Verified sales per affiliate (sales with ≥1 verification)
    const verifiedByAffiliate = await Sale.findAll({
      where: completedWhere,
      attributes: [
        'affiliateId',
        [fn('COUNT', fn('DISTINCT', col('Sale.id'))), 'verifiedSales'],
      ],
      include: [
        {
          model: Verification,
          as: 'verifications',
          attributes: [],
          required: true,
        },
      ],
      group: ['Sale.affiliate_id'],
      raw: true,
    });

    const verifiedMap = new Map(
      verifiedByAffiliate.map((r) => [r.affiliateId, Number(r.verifiedSales)])
    );

    // 3. Unique buyers per affiliate
    const uniqueBuyersByAffiliate = await Verification.findAll({
      where: { affiliateId: { [Op.in]: affiliateIds } },
      attributes: [
        'affiliateId',
        [fn('COUNT', fn('DISTINCT', col('buyer_id'))), 'uniqueBuyers'],
      ],
      group: ['affiliate_id'],
      raw: true,
    });

    const uniqueBuyersMap = new Map(
      uniqueBuyersByAffiliate.map((r) => [r.affiliateId, Number(r.uniqueBuyers)])
    );

    // 4. Affiliate names
    const affiliates = await User.findAll({
      where: { id: { [Op.in]: affiliateIds } },
      attributes: ['id', 'name'],
    });
    const nameMap = new Map(affiliates.map((u) => [u.id, u.name]));

    return ok(res, {
      generatedAt: new Date().toISOString(),
      affiliates: salesByAffiliate.map((r) => {
        const completedSales = Number(r.completedSales);
        const verifiedSales = verifiedMap.get(r.affiliateId) || 0;
        return {
          affiliateId: r.affiliateId,
          affiliateName: nameMap.get(r.affiliateId) || null,
          completedSales,
          verifiedSales,
          unverifiedSales: completedSales - verifiedSales,
          verificationRate:
            completedSales > 0 ? +(verifiedSales / completedSales).toFixed(3) : 0,
          uniqueBuyers: uniqueBuyersMap.get(r.affiliateId) || 0,
        };
      }),
    });
  } catch (err) {
    console.error('[verify] adminReport error:', err);
    return fail(res, 'Could not generate report', 500);
  }
};