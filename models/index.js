// models/index.js - Add fallback for Vercel
'use strict';

const pg = require('pg');
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];
const db = {};

// ===== FALLBACK: Hardcode DATABASE_URL for Vercel =====
const FALLBACK_DATABASE_URL = 'postgresql://ajeku_agro_user:DYNwf6YYYNuzOb2NBJNWnlax6gm0KNmy@dpg-d998drpo3t8c73f1qbcg-a.frankfurt-postgres.render.com/ajeku_agro_3tib';

let sequelize;

// Try to use DATABASE_URL from environment, fallback to hardcoded
const dbUrl = process.env.DATABASE_URL || FALLBACK_DATABASE_URL;

console.log('=== DATABASE CONNECTION ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Using DATABASE_URL:', dbUrl ? 'YES' : 'NO');

if (dbUrl) {
  console.log("Connecting to database...");

  sequelize = new Sequelize(dbUrl, {
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
      max: 3,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    retry: {
      max: 3,
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

// Test connection
sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connection successful");
  })
  .catch((error) => {
    console.error("❌ Error connecting to the database:", error.message);
  });

// Import models
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

module.exports = db;