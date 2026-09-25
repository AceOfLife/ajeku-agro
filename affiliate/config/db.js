const { Sequelize } = require('sequelize');
const config = require('./config');

const env = process.env.NODE_ENV || 'development';
const cfg = config[env];

if (!cfg) throw new Error(`No affiliate DB config for env: ${env}`);

const sequelize = new Sequelize(cfg.database, cfg.username, cfg.password, {
  host: cfg.host,
  port: cfg.port,
  dialect: cfg.dialect,
  dialectOptions: cfg.dialectOptions,
  pool: cfg.pool,
  logging: cfg.logging,
  define: {
    ...cfg.define,
    schema: 'affiliate',
  },
});

module.exports = sequelize;