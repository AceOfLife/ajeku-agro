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

// ===== HARDCODED FALLBACK FOR VERCEL =====
const FALLBACK_DATABASE_URL = 'postgresql://neondb_owner:npg_jMKsL9gBZ4Vh@ep-crimson-fire-atipoxqf-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

let sequelize;

// Use DATABASE_URL from environment, or fallback to hardcoded
const dbUrl = process.env.DATABASE_URL || FALLBACK_DATABASE_URL;

console.log('=== DATABASE CONNECTION ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Using DATABASE_URL from:', process.env.DATABASE_URL ? 'ENV' : 'FALLBACK');

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

sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connection successful");
  })
  .catch((error) => {
    console.error("❌ Error connecting to the database:", error.message);
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

module.exports = db;