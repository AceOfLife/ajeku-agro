// api/test-db.js
const { Client } = require('pg');

module.exports = async (req, res) => {
  // Use the DATABASE_URL environment variable
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Accept self-signed certificates
    },
  });

  try {
    // Attempt to connect to the database
    await client.connect();
    console.log('Database connection successful');

    // Send a success response if connected
    res.status(200).json({ message: 'Database connected successfully' });

    // Close the connection
    await client.end();
  } catch (err) {
    // Log and return an error response if failed to connect
    console.error('Database connection error:', err);
    res.status(500).json({ message: 'Failed to connect to the database', error: err.message });
  }
};
