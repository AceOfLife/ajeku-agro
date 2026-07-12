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

// ===== DEBUG: Log everything =====
console.log('=== DATABASE CONNECTION DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

if (process.env.DATABASE_URL) {
  // Mask password for security
  const masked = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
  console.log('DATABASE_URL (masked):', masked);
}

let sequelize;

if (process.env.DATABASE_URL) {
  console.log("Attempting to connect with DATABASE_URL...");

  // Parse the URL to get components
  let parsedUrl;
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('Parsed URL:');
    console.log('  protocol:', url.protocol);
    console.log('  hostname:', url.hostname);
    console.log('  port:', url.port || '5432');
    console.log('  pathname:', url.pathname);
    console.log('  username:', url.username);
  } catch (e) {
    console.error('Failed to parse DATABASE_URL:', e.message);
  }

  // Try with different configurations
  const configs = [
    {
      name: 'No SSL',
      dialectOptions: {},
    },
    {
      name: 'SSL with rejectUnauthorized: false',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    },
    {
      name: 'SSL with rejectUnauthorized: false + keepAlive',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
        keepAlive: true,
      },
    },
    {
      name: 'SSL with rejectUnauthorized: true',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: true,
        },
      },
    },
  ];

  let connectionError = null;
  let connectedConfig = null;

  for (const config of configs) {
    try {
      console.log(`\n🔄 Trying: ${config.name}`);
      console.log(`  dialectOptions:`, JSON.stringify(config.dialectOptions, null, 2));

      const testSequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectModule: pg,
        dialectOptions: config.dialectOptions,
        logging: false,
        pool: {
          max: 1,
          min: 0,
          acquire: 15000,
          idle: 10000,
        },
        retry: {
          max: 1,
        },
      });

      console.log('  ⏳ Authenticating...');
      await testSequelize.authenticate();
      console.log(`  ✅ SUCCESS! Connected with: ${config.name}`);
      sequelize = testSequelize;
      connectedConfig = config.name;
      break;
    } catch (error) {
      console.error(`  ❌ FAILED: ${error.message}`);
      console.error(`  Error type:`, error.name);
      console.error(`  Error code:`, error.code || 'N/A');
      if (error.parent) {
        console.error(`  Parent error:`, error.parent.message || error.parent);
      }
      connectionError = error;
      // Close the connection if it was opened
      try { await testSequelize.close(); } catch (e) {}
    }
  }

  if (!sequelize) {
    console.error('\n❌ All connection attempts failed!');
    console.error('Last error:', connectionError?.message);
    throw connectionError;
  }

  console.log(`\n✅ Connected successfully with: ${connectedConfig}`);

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

// Final authentication test
console.log('\n=== FINAL AUTHENTICATION TEST ===');
sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connection successful");
  })
  .catch((error) => {
    console.error("❌ Final authentication failed:", error.message);
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