const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // from .env
  database: process.env.DB_NAME || 'green_market',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection immediately
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('💡 Check your .env file — is DB_PASSWORD set correctly?');
    console.error('💡 Make sure MySQL is running on port', process.env.DB_PORT || 3306);
    process.exit(1);
  } else {
    console.log('✅ Database connected successfully');
    console.log('📊 Database:', process.env.DB_NAME || 'green_market');
    connection.release();
  }
});

// Graceful shutdown on process exit
process.on('SIGTERM', () => {
  pool.end((err) => {
    if (err) console.error('Error closing pool:', err);
    process.exit(err ? 1 : 0);
  });
});

// Export both regular pool (for callbacks) and promise pool
const promisePool = pool.promise();

module.exports = pool;
module.exports.promise = promisePool;