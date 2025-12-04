const express = require('express');
const router = express.Router();
const db = require('../db');
const emailService = require('../services/emailService');
const logger = require('../logger');

router.post('/', async (req, res) => {
  try {
    const { rfp_id, vendor_id } = req.body;
    if (!rfp_id || !vendor_id) return res.status(400).json({ error: 'rfp_id and vendor_id required' });
    const r = await db.query('SELECT * FROM rfps WHERE id=$1', [rfp_id]);
    const v = await db.query('SELECT * FROM vendors WHERE id=$1', [vendor_id]);
    if (!r.rowCount || !v.rowCount) return res.status(404).json({ error: 'rfp or vendor not found' });
    const rfp = r.rows[0];
    const vendor = v.rows[0];

    const subject = `RFP Request: ${rfp.title || 'Procurement Request'}`;
    const text = `Hello ${vendor.name},\n\nPlease find our RFP below:\n\n${rfp.description}\n\nPlease reply with your proposal.\n\nThanks`;

    await emailService.sendRfpEmail({ to: vendor.email, subject, text, html: `<pre>${rfp.description}</pre>` });
    res.json({ ok: true });
  } catch (err) {
    logger.error('Error sending rfp email', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
