const { Pool } = require('pg');
const logger = require('./logger');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

console.log("Hello    ")
console.log(connectionString);
if (!connectionString) {
  logger.error('DATABASE_URL is not set in environment');
}

const pool = new Pool({ connectionString });

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.info('db query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    logger.error('db error', { text, err: err.message });
    throw err;
  }
}

module.exports = { query, pool };
