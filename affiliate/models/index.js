const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const User = require('./user.model')(sequelize, DataTypes);
const Product = require('./product.model')(sequelize, DataTypes);
const AffiliateProduct = require('./affiliateProduct.model')(sequelize, DataTypes);
const Sale = require('./sale.model')(sequelize, DataTypes);
const Payment = require('./payment.model')(sequelize, DataTypes);
const Buyer = require('./buyer.model')(sequelize, DataTypes);
const Verification = require('./verification.model')(sequelize, DataTypes);

// Self-referential: affiliate (parent) → workers (children)
User.hasMany(User, { as: 'workers', foreignKey: 'parentAffiliateId' });
User.belongsTo(User, { as: 'affiliate', foreignKey: 'parentAffiliateId' });

// Products (catalog) created by admin users
User.hasMany(Product, { foreignKey: 'createdBy', as: 'createdProducts' });
Product.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// AffiliateProduct (per-affiliate assignment of a catalog product)
User.hasMany(AffiliateProduct, { foreignKey: 'affiliateId', as: 'affiliateProducts' });
AffiliateProduct.belongsTo(User, { foreignKey: 'affiliateId', as: 'affiliate' });

Product.hasMany(AffiliateProduct, { foreignKey: 'productId', as: 'affiliateProducts' });
AffiliateProduct.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Sales — reference the affiliate_product assignment
AffiliateProduct.hasMany(Sale, { foreignKey: 'affiliateProductId', as: 'sales' });
Sale.belongsTo(AffiliateProduct, { foreignKey: 'affiliateProductId', as: 'affiliateProduct' });

User.hasMany(Sale, { foreignKey: 'affiliateId', as: 'sales' });      // partner owns commission
Sale.belongsTo(User, { foreignKey: 'affiliateId', as: 'affiliate' });

User.hasMany(Sale, { foreignKey: 'loggedByUserId', as: 'loggedSales' });
Sale.belongsTo(User, { foreignKey: 'loggedByUserId', as: 'loggedBy' });

// Payments
User.hasMany(Payment, { foreignKey: 'affiliateId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'affiliateId', as: 'affiliate' });

User.hasMany(Payment, { foreignKey: 'createdBy', as: 'createdPayments' });
Payment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Buyers — one per (affiliate, email)
User.hasMany(Buyer, { foreignKey: 'affiliateId', as: 'buyers' });
Buyer.belongsTo(User, { foreignKey: 'affiliateId', as: 'affiliate' });

// Verifications — a buyer verifying a specific sale
User.hasMany(Verification, { foreignKey: 'affiliateId', as: 'verifications' });
Verification.belongsTo(User, { foreignKey: 'affiliateId', as: 'affiliate' });

Sale.hasMany(Verification, { foreignKey: 'saleId', as: 'verifications' });
Verification.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });

Buyer.hasMany(Verification, { foreignKey: 'buyerId', as: 'verifications' });
Verification.belongsTo(Buyer, { foreignKey: 'buyerId', as: 'buyer' });

module.exports = {
  sequelize,
  User,
  Product,
  AffiliateProduct,
  Sale,
  Payment,
  Buyer,
  Verification,
};