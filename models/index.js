// models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const pg = require('pg');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

const db = {};

console.log('========================================');
console.log('Database Initialization');
console.log('========================================');
console.log('NODE_ENV:', env);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

let sequelize;

if (process.env.DATABASE_URL) {
  const maskedUrl = process.env.DATABASE_URL.replace(/:\/\/(.*?):(.*?)@/, '://$1:****@');
  console.log('Using DATABASE_URL:', maskedUrl);

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: pg,

    protocol: 'postgres',

    logging: false,

    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },

    pool: {
      max: 3,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },

    retry: {
      max: 3,
    },
  });
} else {
  console.log('Using config.json database configuration');

  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      logging: false,

      dialectOptions: config.dialectOptions || {},

      pool: config.pool || {
        max: 3,
        min: 0,
        acquire: 60000,
        idle: 10000,
      },
    }
  );
}

// Test database connection (non-blocking)
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed');
    console.error('Error Name:', err.name);
    console.error('Message:', err.message);

    if (err.parent) {
      console.error('Parent Error:', err.parent.message);
      console.error('Parent Code:', err.parent.code);
    }

    if (err.original) {
      console.error('Original Error:', err.original.message);
      console.error('Original Code:', err.original.code);
    }
  }
})();

// Load models
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// Run associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;