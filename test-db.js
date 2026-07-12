// test-db.js
const { Sequelize } = require('sequelize');
const pg = require('pg');

// Hardcode the URL directly (no environment variable needed)
const DATABASE_URL = 'postgresql://neondb_owner:npg_jMKsL9gBZ4Vh@ep-crimson-fire-atipoxqf-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

console.log('=== TESTING DATABASE CONNECTION ===');
console.log('URL (masked):', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: pg,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
  pool: {
    max: 1,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code || 'N/A');
    console.error('Original:', error.original || 'N/A');
    process.exit(1);
  });