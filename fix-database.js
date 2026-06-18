// fix-database.js
const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

// Force production environment
const env = 'production';
const dbConfig = config[env];

console.log(`🔧 Connecting to ${env} database...`);

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
    console.log('✅ Connected to production database');

    // Check if ENUM exists
    const [enumCheck] = await sequelize.query(`
      SELECT 1 FROM pg_type WHERE typname = 'enum_Users_default_produce_preference'
    `);

    if (enumCheck.length > 0) {
      console.log('🔍 ENUM exists. Fixing...');

      // Step 1: Change column type to VARCHAR
      await sequelize.query(`
        ALTER TABLE "Users" ALTER COLUMN "default_produce_preference" TYPE VARCHAR(255) USING "default_produce_preference"::text;
      `);
      console.log('✅ Column type changed to VARCHAR');

      // Step 2: Drop the ENUM
      await sequelize.query(`
        DROP TYPE "enum_Users_default_produce_preference";
      `);
      console.log('✅ ENUM dropped successfully');

      console.log('🎉 Database fix completed!');
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