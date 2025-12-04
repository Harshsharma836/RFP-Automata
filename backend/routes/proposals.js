const express = require('express');
const router = express.Router();
const db = require('../db');
const ai = require('../services/aiService');
const logger = require('../logger');

// Parse vendor response text into structured proposal
router.post('/parse', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });
    const proposal = await ai.parseProposalText(text);
    res.json({ ok: true, proposal });
  } catch (err) {
    logger.error('Error parsing proposal', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Save a parsed proposal for an RFP (vendor submits)
router.post('/', async (req, res) => {
  try {
    const { rfp_id, vendor_id, proposal } = req.body;
    if (!rfp_id || !vendor_id || !proposal) return res.status(400).json({ error: 'rfp_id, vendor_id and proposal required' });
    const q = await db.query('INSERT INTO proposals(rfp_id, vendor_id, proposal_json) VALUES($1,$2,$3) RETURNING *', [rfp_id, vendor_id, JSON.stringify(proposal)]);
    res.json({ ok: true, proposal: q.rows[0] });
  } catch (err) {
    logger.error('Error saving proposal', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Compare proposals for a given RFP
router.get('/compare/:rfpId', async (req, res) => {
  try {
    const { rfpId } = req.params;
    const rfpQ = await db.query('SELECT * FROM rfps WHERE id=$1', [rfpId]);
    if (!rfpQ.rowCount) return res.status(404).json({ error: 'rfp not found' });
    const rfp = rfpQ.rows[0];
    const pQ = await db.query('SELECT p.*, v.name as vendor_name FROM proposals p JOIN vendors v ON v.id = p.vendor_id WHERE p.rfp_id=$1', [rfpId]);
    const proposals = pQ.rows.map(r => ({ id: r.id, vendor: r.vendor_name, ...r.proposal_json }));
    const compared = await ai.compareProposals(rfp, proposals);
    res.json({ ok: true, compared });
  } catch (err) {
    logger.error('Error comparing proposals', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
