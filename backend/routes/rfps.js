const express = require('express');
const router = express.Router();
const db = require('../db');
const ai = require('../services/aiService');
const logger = require('../logger');

// Create RFP from natural language (AI-driven)
router.post('/parse', async (req, res) => {
  try {

    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });
    // console.log("Text received:", text);
    // return;
    const structured = await ai.parseRfpFromText(text);
    res.json({ ok: true, rfp: structured });
  } catch (err) {
    logger.error('Error parsing RFP', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Persist a structured RFP
router.post('/', async (req, res) => {
  try {
    const { title, description, budget, delivery_days, items } = req.body;
    const q = await db.query(
      'INSERT INTO rfps(title, description, budget, delivery_days, items) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [title, description, budget || null, delivery_days || null, JSON.stringify(items || [])]
    );
    res.json({ ok: true, rfp: q.rows[0] });
  } catch (err) {
    logger.error('Error creating RFP', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const q = await db.query('SELECT * FROM rfps ORDER BY created_at DESC');
    res.json({ ok: true, rfps: q.rows });
  } catch (err) {
    logger.error('Error fetching RFPs', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const q = await db.query('SELECT * FROM rfps WHERE id=$1', [id]);
    if (!q.rowCount) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true, rfp: q.rows[0] });
  } catch (err) {
    logger.error('Error fetching RFP', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
