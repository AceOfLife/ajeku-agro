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

// Parse DATABASE_URL once (used for production). Falls back to individual
// DB_* vars if DATABASE_URL is not set.
const parseUrl = (raw) => {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return {
      username: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
      host: u.hostname,
      port: u.port ? Number(u.port) : 5432,
    };
  } catch {
    return null;
  }
};

const prodUrl = parseUrl(process.env.DATABASE_URL);

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
    username: prodUrl ? prodUrl.username : process.env.DB_USER,
    password: prodUrl ? prodUrl.password : process.env.DB_PASSWORD,
    database: prodUrl ? prodUrl.database : process.env.DB_NAME,
    host: prodUrl ? prodUrl.host : process.env.DB_HOST,
    port: prodUrl ? prodUrl.port : 5432,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
      connectTimeout: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
    },
    pool: { max: 3, min: 0, acquire: 60000, idle: 10000 },
  },
};