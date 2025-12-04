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

// Save a parsed proposal for an RFP with AI scoring
router.post('/', async (req, res) => {
  try {
    const { rfp_id, vendor_id, proposal_text, proposal } = req.body;
    
    if (!rfp_id || !vendor_id) {
      return res.status(400).json({ error: 'rfp_id and vendor_id required' });
    }

    // Check RFP and vendor exist
    const rfpQ = await db.query('SELECT * FROM rfps WHERE id=$1', [rfp_id]);
    const vendorQ = await db.query('SELECT * FROM vendors WHERE id=$1', [vendor_id]);

    if (!rfpQ.rows.length || !vendorQ.rows.length) {
      return res.status(404).json({ error: 'rfp or vendor not found' });
    }

    const rfp = rfpQ.rows[0];
    const vendor = vendorQ.rows[0];

    let parsedProposal = proposal;
    if (proposal_text && !proposal) {
      parsedProposal = await ai.parseProposalText(proposal_text);
    }

    const comparison = await ai.compareProposals(rfp, [parsedProposal]);
    const scoredProposal = comparison[0];

    const insertResult = await db.query(
      `INSERT INTO proposals (rfp_id, vendor_id, proposal_json, total, line_items, terms, ai_score, ai_feedback, raw_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        rfp_id,
        vendor_id,
        JSON.stringify(parsedProposal),
        scoredProposal.total || parsedProposal.total || null,
        JSON.stringify(scoredProposal.line_items || parsedProposal.line_items || []),
        scoredProposal.terms || parsedProposal.terms || null,
        scoredProposal.score || 50,
        scoredProposal.reason || 'Proposal analyzed',
        proposal_text || ''
      ]
    );

    logger.info('Proposal saved and scored', {
      rfpId: rfp_id,
      vendorId: vendor_id,
      score: scoredProposal.score
    });

    res.json({
      ok: true,
      proposal: insertResult.rows[0],
      score: scoredProposal.score,
      feedback: scoredProposal.reason
    });
  } catch (err) {
    logger.error('Error saving proposal', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.get('/rfp/:rfp_id', async (req, res) => {
  try {
    const { rfp_id } = req.params;
    const result = await db.query(
      `SELECT p.*, v.name as vendor_name, v.email as vendor_email, v.rating as vendor_rating
       FROM proposals p
       LEFT JOIN vendors v ON p.vendor_id = v.id
       WHERE p.rfp_id = $1
       ORDER BY p.ai_score DESC, p.created_at DESC`,
      [rfp_id]
    );

    res.json({ ok: true, proposals: result.rows });
  } catch (err) {
    logger.error('Error fetching proposals', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT p.*, v.name as vendor_name, v.email as vendor_email
       FROM proposals p
       LEFT JOIN vendors v ON p.vendor_id = v.id
       WHERE p.id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    res.json({ ok: true, proposal: result.rows[0] });
  } catch (err) {
    logger.error('Error fetching proposal', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.get('/compare/:rfpId', async (req, res) => {
  try {
    const { rfpId } = req.params;
    
    const rfpQ = await db.query('SELECT * FROM rfps WHERE id=$1', [rfpId]);
    if (!rfpQ.rows.length) return res.status(404).json({ error: 'rfp not found' });
    
    const rfp = rfpQ.rows[0];
    
    const pQ = await db.query(
      `SELECT p.*, v.name as vendor_name, v.rating as vendor_rating
       FROM proposals p
       JOIN vendors v ON v.id = p.vendor_id
       WHERE p.rfp_id=$1
       ORDER BY p.ai_score DESC`,
      [rfpId]
    );

    const proposals = pQ.rows.map(r => ({
      id: r.id,
      vendor_id: r.vendor_id,
      vendor_name: r.vendor_name,
      vendor_rating: r.vendor_rating,
      total: r.total,
      line_items: r.line_items,
      terms: r.terms,
      ai_score: r.ai_score,
      ai_feedback: r.ai_feedback,
      proposal_json: r.proposal_json
    }));

    res.json({ ok: true, rfp, proposals });
  } catch (err) {
    logger.error('Error comparing proposals', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Delete a proposal
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM proposals WHERE id=$1 RETURNING *', [id]);
    
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    logger.info('Proposal deleted', { proposalId: id });
    res.json({ ok: true });
  } catch (err) {
    logger.error('Error deleting proposal', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
