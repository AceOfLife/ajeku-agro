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

let sequelize;

if (process.env.DATABASE_URL) {
  console.log("Using DATABASE_URL for connection...");

  // Try different SSL configurations
  const sslConfigs = [
    // Option 1: No SSL (for internal connections)
    undefined,
    // Option 2: SSL with rejectUnauthorized: false
    { require: true, rejectUnauthorized: false },
    // Option 3: SSL with no-verify
    { require: true, rejectUnauthorized: false, sslmode: 'no-verify' },
  ];

  // Try the first one that works
  let lastError = null;
  let sslConfig = null;

  for (const config of sslConfigs) {
    try {
      const testSequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectModule: pg,
        protocol: 'postgres',
        dialectOptions: config ? { ssl: config } : {},
        logging: false,
        pool: {
          max: 1,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        retry: {
          max: 1,
        },
      });

      // Test the connection
      await testSequelize.authenticate();
      console.log(`✅ Connected with SSL config:`, config || 'none');
      sslConfig = config;
      sequelize = testSequelize;
      break;
    } catch (error) {
      console.log(`❌ Failed with SSL config:`, config || 'none', error.message);
      lastError = error;
      // Close the connection if it was opened
      try { await testSequelize.close(); } catch (e) {}
    }
  }

  if (!sequelize) {
    console.error('❌ All connection attempts failed:', lastError?.message);
    throw lastError;
  }

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