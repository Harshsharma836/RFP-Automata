const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../logger');

router.post('/', async (req, res) => {
  try {
    const { name, email, contact } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });
    const q = await db.query('INSERT INTO vendors(name, email, contact) VALUES($1,$2,$3) RETURNING *', [name, email, contact || null]);
    res.json({ ok: true, vendor: q.rows[0] });
  } catch (err) {
    logger.error('Error creating vendor', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const q = await db.query('SELECT * FROM vendors ORDER BY name');
    res.json({ ok: true, vendors: q.rows });
  } catch (err) {
    console.log(err);
    logger.error('Error fetching vendors', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
