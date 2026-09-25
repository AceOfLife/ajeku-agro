require('dotenv').config();

const base = {
  dialect: 'postgres',
  port: 5432,
  migrationStorageTableName: 'AffiliateSequelizeMeta',
  define: {
    underscored: true,
    timestamps: true,
  },
  logging: false,
};

module.exports = {
  development: {
    ...base,
    username: process.env.DB_USER || 'ajeku_realty_user',
    password: process.env.DB_PASSWORD || 'Prolifik1',
    database: process.env.DB_NAME || 'ajeku_realty_db',
    host: process.env.DB_HOST || 'localhost',
  },
  production: {
    ...base,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
    pool: { max: 3, min: 0, acquire: 60000, idle: 10000 },
  },
};