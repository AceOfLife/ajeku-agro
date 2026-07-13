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

// ===== VERBOSE DEBUGGING =====
console.log('=== DATABASE DEBUG START ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Environment variables available:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ EXISTS' : '❌ MISSING');
console.log('  DB_HOST:', process.env.DB_HOST || '❌ MISSING');
console.log('  DB_USER:', process.env.DB_USER || '❌ MISSING');
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ EXISTS' : '❌ MISSING');
console.log('  DB_NAME:', process.env.DB_NAME || '❌ MISSING');

let sequelize;

if (process.env.DATABASE_URL) {
  console.log("Using DATABASE_URL for connection...");
  console.log("DATABASE_URL preview:", process.env.DATABASE_URL.substring(0, 50) + '...');

  // Parse URL to check components
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('Parsed URL:');
    console.log('  protocol:', url.protocol);
    console.log('  hostname:', url.hostname);
    console.log('  port:', url.port || '5432');
    console.log('  pathname:', url.pathname);
  } catch (e) {
    console.error('Failed to parse DATABASE_URL:', e.message);
  }

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: pg,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: console.log,
    pool: {
      max: 1,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });

} else {
  console.log("Using config.json for database connection...");
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    port: config.port,
    dialectOptions: config.dialectOptions || {},
    logging: console.log,
    pool: {
      max: 1,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
}

console.log('=== AUTHENTICATING ===');
sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connection successful");
  })
  .catch((error) => {
    console.error("❌ Error connecting to the database:", error.message);
    console.error("❌ Full error:", error);
  });

fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 && 
      file !== basename && 
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

console.log('=== DATABASE SETUP COMPLETE ===');

module.exports = db;