const { Sequelize } = require('sequelize');
const config = require('./config');

const env = process.env.NODE_ENV || 'development';
const cfg = config[env];

if (!cfg) throw new Error(`No affiliate DB config for env: ${env}`);

let sequelize;

if (process.env.DATABASE_URL && env === 'production') {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
      connectTimeout: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
    },
    pool: { max: 3, min: 0, acquire: 30000, idle: 10000 },
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
      schema: 'affiliate',
    },
  });
} else {
  sequelize = new Sequelize(cfg.database, cfg.username, cfg.password, {
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
}

module.exports = sequelize;