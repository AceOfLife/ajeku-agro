// models/index.js
'use strict';

const { Sequelize } = require('sequelize');
const pg = require('pg');
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const db = {};

// ===== USE THE SAME CONFIG THAT WORKED IN TEST-SERVER =====
const DATABASE_URL = 'postgresql://ajeku_agro_zsrn_user:HSZc1aZHD4PO8ow1hBcKxmyEkO9Ulr8F@dpg-d9ti84favr4c73btb1g0-a.ohio-postgres.render.com/ajeku_agro_zsrn';

console.log('=== DATABASE CONNECTION ===');

// Create Sequelize instance with the SAME configuration that works
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: pg,
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false
    }
  },
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

console.log('Testing connection...');
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

console.log('=== DATABASE SETUP COMPLETE ===');

module.exports = db;