const { AffiliateProduct, Product, User } = require('../models');
const { ok, fail } = require('../utils/response');

const serialize = (ap) => ({
  id: ap.id,
  affiliateId: ap.affiliateId,
  productId: ap.productId,
  commissionPercent: Number(ap.commissionPercent),
  quantity: ap.quantity,
  isActive: ap.isActive,
  createdAt: ap.createdAt,
  updatedAt: ap.updatedAt,
  ...(ap.product
    ? {
        product: {
          id: ap.product.id,
          name: ap.product.name,
          description: ap.product.description,
          imageUrls: ap.product.imageUrls,
          price: Number(ap.product.price),
          isActive: ap.product.isActive,
        },
      }
    : {}),
});

const withProduct = {
  model: Product,
  as: 'product',
  attributes: ['id', 'name', 'description', 'imageUrls', 'price', 'isActive'],
};

// POST /api/affiliate/admin/affiliates/:affiliateId/products   (admin)
exports.assignProduct = async (req, res) => {
  const { affiliateId } = req.params;
  const { productId, commissionPercent, quantity } = req.body;

  const affiliate = await User.findOne({ where: { id: affiliateId, role: 'affiliate' } });
  if (!affiliate) return fail(res, 'Affiliate not found', 404);

  const product = await Product.findByPk(productId);
  if (!product) return fail(res, 'Product not found', 404);

  const existing = await AffiliateProduct.findOne({
    where: { affiliateId, productId },
  });
  if (existing) return fail(res, 'Product already assigned to this affiliate', 409);

  const ap = await AffiliateProduct.create({
    affiliateId,
    productId,
    commissionPercent,
    quantity,
  });

  await ap.reload({ include: [withProduct] });
  return ok(res, serialize(ap), 'Product assigned', 201);
};

// GET /api/affiliate/admin/affiliates/:affiliateId/products   (admin)
exports.listByAffiliate = async (req, res) => {
  const { affiliateId } = req.params;
  const where = { affiliateId };
  if (req.query.includeInactive !== 'true') where.isActive = true;

  const rows = await AffiliateProduct.findAll({
    where,
    include: [withProduct],
    order: [['createdAt', 'DESC']],
  });
  return ok(res, rows.map(serialize));
};

// GET /api/affiliate/my-products   (affiliate: own; worker: parent affiliate's)
exports.listMyProducts = async (req, res) => {
  const affiliateId =
    req.user.role === 'worker' ? req.user.parentAffiliateId : req.user.id;
  if (!affiliateId) return fail(res, 'Could not resolve affiliate', 400);

  const where = { affiliateId };
  if (req.query.includeInactive !== 'true') where.isActive = true;

  const rows = await AffiliateProduct.findAll({
    where,
    include: [withProduct],
    order: [['createdAt', 'DESC']],
  });
  return ok(res, rows.map(serialize));
};

// GET /api/affiliate/affiliate-products/:id   (admin, or owning affiliate)
exports.getOne = async (req, res) => {
  const ap = await AffiliateProduct.findByPk(req.params.id, { include: [withProduct] });
  if (!ap) return fail(res, 'Assignment not found', 404);
  if (req.user.role === 'affiliate' && ap.affiliateId !== req.user.id) {
    return fail(res, 'Forbidden', 403);
  }
  return ok(res, serialize(ap));
};

// PATCH /api/affiliate/affiliate-products/:id   (admin)
exports.update = async (req, res) => {
  const ap = await AffiliateProduct.findByPk(req.params.id);
  if (!ap) return fail(res, 'Assignment not found', 404);

  const { commissionPercent, quantity, isActive } = req.body;
  if (commissionPercent !== undefined) ap.commissionPercent = commissionPercent;
  if (quantity !== undefined) ap.quantity = quantity;
  if (isActive !== undefined) ap.isActive = isActive === true || isActive === 'true';

  await ap.save();
  await ap.reload({ include: [withProduct] });
  return ok(res, serialize(ap), 'Assignment updated');
};

// PATCH /api/affiliate/affiliate-products/:id/stock   (admin)
exports.adjustStock = async (req, res) => {
  const ap = await AffiliateProduct.findByPk(req.params.id);
  if (!ap) return fail(res, 'Assignment not found', 404);

  const { quantity, adjustment } = req.body;
  if (quantity !== undefined) {
    ap.quantity = parseInt(quantity, 10);
  } else {
    const next = ap.quantity + parseInt(adjustment, 10);
    if (next < 0) return fail(res, 'Adjustment would make stock negative', 400);
    ap.quantity = next;
  }

  await ap.save();
  await ap.reload({ include: [withProduct] });
  return ok(res, serialize(ap), 'Stock updated');
};

// DELETE /api/affiliate/affiliate-products/:id   (admin) — soft delete
exports.remove = async (req, res) => {
  const ap = await AffiliateProduct.findByPk(req.params.id);
  if (!ap) return fail(res, 'Assignment not found', 404);
  ap.isActive = false;
  await ap.save();
  return ok(res, serialize(ap), 'Assignment deactivated');
};