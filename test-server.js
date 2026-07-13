// test-server.js
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Hardcoded connection - use your Render URL
const DATABASE_URL = 'postgresql://ajeku_agro_28ie_user:Lz33s2Yw32NpZ6F7oTWYYDf8DVcWcNas@dpg-d99mqlbtqb8s73aqm0og-a.oregon-postgres.render.com/ajeku_agro_28ie';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Test server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time, 1 as test');
    res.json({
      success: true,
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('DB Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`📊 Test DB endpoint: /test-db`);
});