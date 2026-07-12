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
  console.log("NODE_ENV:", process.env.NODE_ENV);

  // Internal connection (no SSL required)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: pg,
    dialectOptions: {},
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