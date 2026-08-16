// fix-database.js
const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

// Force production environment
const env = 'production';
const dbConfig = config[env];

// Create sequelize instance using config
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    port: dbConfig.port,
    dialectOptions: dbConfig.dialectOptions,
    logging: false
  }
);

async function fixDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    // Check if ENUM exists
    const [enumCheck] = await sequelize.query(`
      SELECT 1 FROM pg_type WHERE typname = 'enum_Users_default_produce_preference'
    `);

    if (enumCheck.length > 0) {

      // Step 1: Change column type to VARCHAR
      await sequelize.query(`
        ALTER TABLE "Users" ALTER COLUMN "default_produce_preference" TYPE VARCHAR(255) USING "default_produce_preference"::text;
      `);

      // Step 2: Drop the ENUM
      await sequelize.query(`
        DROP TYPE "enum_Users_default_produce_preference";
      `);
    } else {
      console.log('✅ ENUM does not exist. No fix needed.');
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing database:', error.message);
    console.error('Details:', error);
    await sequelize.close();
    process.exit(1);
  }
}

fixDatabase();