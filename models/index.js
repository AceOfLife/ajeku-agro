// models/index.js
'use strict';

const pg = require('pg');
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];
const db = {};

console.log('=== DATABASE CONNECTION SETUP ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

let sequelize;

if (process.env.DATABASE_URL) {
  console.log("Configuring connection for Production/Render...");

  // Mask password for security logging
  const masked = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
  console.log('DATABASE_URL (masked):', masked);

  // Directly initialize with Render's required SSL settings
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: pg,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Bypasses Render self-signed certificate restriction
      },
      keepAlive: true,
    },
    logging: console.log, // Keeps tracking queries in Vercel function logs
    pool: {
      max: 2,        // Strict low limit to fit into Render Free Tier (Max 5 total across all instances)
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });

} else {
  console.log("Using local config for database connection...");
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    port: config.port,
    dialectOptions: config.dialectOptions || {},
    logging: false,
    pool: {
      max: 3,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
}

// Lazy authentication test - non-blocking for module exports
sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connection initialized successfully");
  })
  .catch((error) => {
    console.error("❌ Database initialization failed:", error.message);
  });

// Import models
console.log('\n=== LOADING MODELS ===');
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 && 
      file !== basename && 
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    console.log(`  Loading: ${file}`);
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

console.log('\n=== SETTING UP ASSOCIATIONS ===');
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    console.log(`  Setting associations for: ${modelName}`);
    db[modelName].associate(db);
  }
});

console.log('\n=== DATABASE SETUP COMPLETE ===');

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
