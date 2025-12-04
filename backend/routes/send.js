const express = require('express');
const router = express.Router();
const db = require('../db');
const emailService = require('../services/emailService');
const logger = require('../logger');

router.post('/', async (req, res) => {
  try {
    const { rfp_id, vendor_ids } = req.body;

    if (!rfp_id || !vendor_ids || !Array.isArray(vendor_ids) || vendor_ids.length === 0) {
      return res.status(400).json({ error: 'rfp_id and vendor_ids array required' });
    }

    // Get RFP
    const rfpQ = await db.query('SELECT * FROM rfps WHERE id=$1', [rfp_id]);
    if (!rfpQ.rows.length) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    const rfp = rfpQ.rows[0];

    // Get vendors
    const vendorQ = await db.query(
      `SELECT * FROM vendors WHERE id = ANY($1)`,
      [vendor_ids]
    );

    if (vendorQ.rows.length === 0) {
      return res.status(404).json({ error: 'No valid vendors found' });
    }

    const results = [];
    const errors = [];

    // Send email to each vendor
    for (const vendor of vendorQ.rows) {
      try {
        await emailService.sendRfpEmail({
          to: vendor.email,
          rfpData: rfp,
          vendorName: vendor.name,
          vendorId: vendor.id
        });

        // Track the send
        await db.query(
          `INSERT INTO email_sends (rfp_id, vendor_id, status) VALUES ($1, $2, 'sent')`,
          [rfp_id, vendor.id]
        );

        results.push({
          vendor_id: vendor.id,
          vendor_name: vendor.name,
          email: vendor.email,
          status: 'sent'
        });

        logger.info('RFP sent to vendor', {
          rfpId: rfp_id,
          vendorId: vendor.id,
          vendorName: vendor.name
        });
      } catch (err) {
        errors.push({
          vendor_id: vendor.id,
          vendor_name: vendor.name,
          email: vendor.email,
          error: err.message
        });

        logger.error('Failed to send RFP to vendor', {
          rfpId: rfp_id,
          vendorId: vendor.id,
          error: err.message
        });
      }
    }

    const allSuccess = errors.length === 0;
    res.status(allSuccess ? 200 : 207).json({
      ok: allSuccess,
      sent: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    logger.error('Error in send RFP endpoint', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.post('/response', async (req, res) => {
  try {
    const { rfp_id, vendor_id, proposal_text } = req.body;

    if (!rfp_id || !vendor_id || !proposal_text) {
      return res.status(400).json({ error: 'rfp_id, vendor_id, and proposal_text required' });
    }

    // Verify RFP and vendor exist
    const rfpQ = await db.query('SELECT * FROM rfps WHERE id=$1', [rfp_id]);
    const vendorQ = await db.query('SELECT * FROM vendors WHERE id=$1', [vendor_id]);

    if (!rfpQ.rows.length || !vendorQ.rows.length) {
      return res.status(404).json({ error: 'RFP or vendor not found' });
    }

    // Create proposal through proposals route (will be parsed and scored)
    const proposalRes = await fetch(`http://localhost:${process.env.PORT || 4000}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rfp_id, vendor_id, proposal_text })
    });

    if (!proposalRes.ok) {
      throw new Error(`Failed to save proposal: ${proposalRes.statusText}`);
    }

    const proposalData = await proposalRes.json();

    // Send acknowledgment email
    const rfp = rfpQ.rows[0];
    const vendor = vendorQ.rows[0];

    try {
      await emailService.sendProposalAcknowledgment({
        to: vendor.email,
        vendorName: vendor.name,
        rfpTitle: rfp.title || `RFP #${rfp_id}`
      });
    } catch (err) {
      logger.warn('Could not send acknowledgment', { error: err.message });
    }

    logger.info('Proposal response received and processed', {
      rfpId: rfp_id,
      vendorId: vendor_id
    });

    res.json({
      ok: true,
      proposal: proposalData.proposal,
      score: proposalData.score,
      feedback: proposalData.feedback
    });
  } catch (err) {
    logger.error('Error processing proposal response', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.get('/history/:rfp_id', async (req, res) => {
  try {
    const { rfp_id } = req.params;

    const result = await db.query(
      `SELECT es.*, v.name as vendor_name, v.email as vendor_email
       FROM email_sends es
       LEFT JOIN vendors v ON es.vendor_id = v.id
       WHERE es.rfp_id = $1
       ORDER BY es.sent_at DESC`,
      [rfp_id]
    );

    res.json({ ok: true, history: result.rows });
  } catch (err) {
    logger.error('Error fetching send history', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
