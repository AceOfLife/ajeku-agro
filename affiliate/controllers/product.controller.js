const { Product } = require('../models');
const { ok, fail } = require('../utils/response');
const cloudinaryService = require('../services/cloudinary.service');

const serialize = (p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  imageUrls: p.imageUrls,
  price: Number(p.price),
  isActive: p.isActive,
  createdBy: p.createdBy,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

// POST /api/affiliate/products   (admin)
exports.createProduct = async (req, res) => {
  const { name, description, price } = req.body;

  const uploaded = await cloudinaryService.uploadProductImages(req.files || []);

  const product = await Product.create({
    name,
    description: description || null,
    imageUrls: uploaded,
    price,
    createdBy: req.user.id,
  });

  return ok(res, serialize(product), 'Product created', 201);
};

// GET /api/affiliate/products   (admin, affiliate, worker)
exports.listProducts = async (req, res) => {
  const where = {};
  if (req.user.role !== 'admin' || req.query.includeInactive !== 'true') {
    where.isActive = true;
  }
  const products = await Product.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });
  return ok(res, products.map(serialize));
};

// GET /api/affiliate/products/:id   (any role)
exports.getProduct = async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return fail(res, 'Product not found', 404);
  return ok(res, serialize(product));
};

// PATCH /api/affiliate/products/:id   (admin)
// If files are sent: replaces entire imageUrls (old ones deleted from Cloudinary).
exports.updateProduct = async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return fail(res, 'Product not found', 404);

  const { name, description, price, isActive } = req.body;

  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (isActive !== undefined) product.isActive = isActive === true || isActive === 'true';

  if (req.files && req.files.length > 0) {
    const uploaded = await cloudinaryService.uploadProductImages(req.files);
    const oldPublicIds = (product.imageUrls || [])
      .map((i) => i.publicId)
      .filter(Boolean);
    await cloudinaryService.deleteProductImages(oldPublicIds);
    product.imageUrls = uploaded;
  }

  await product.save();
  return ok(res, serialize(product), 'Product updated');
};

// DELETE /api/affiliate/products/:id   (admin)  → soft delete
exports.deleteProduct = async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return fail(res, 'Product not found', 404);

  product.isActive = false;
  await product.save();
  return ok(res, serialize(product), 'Product deleted');
};