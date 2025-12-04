const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const aiService = require('../services/aiService');
const logger = require('../logger');
const crypto = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function verifyWebhookSignature(req) {
  const signature = req.headers['x-twilio-email-event-webhook-signature'];
  const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'];
  const webhookKey = process.env.SENDGRID_WEBHOOK_KEY;

  if (!signature || !timestamp || !webhookKey) {
    return false;
  }

  // Create signed content
  const signedContent = timestamp + req.rawBody;
  
  // Hash using webhook key
  const hash = crypto
    .createHmac('sha256', webhookKey)
    .update(signedContent)
    .digest('base64');

  // Compare signatures (timing-safe)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hash)
  );
}

function parseEmailBody(html, text) {
  let content = text || '';

  // If only HTML, try to extract text
  if (!content && html) {
    // Remove script and style tags
    content = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');
  }

  // Clean up
  content = content
    .split('\n')
    // Remove email signatures (lines starting with --, __, etc)
    .filter(line => !line.match(/^[\-_]{2,}/))
    // Remove common footer indicators
    .filter(line => !line.match(/^(Sent from|On .* wrote:|Best regards|Thanks)/i))
    .join('\n')
    .trim();

  return content;
}

function extractVendorEmail(from) {
  // from could be "Name <email@example.com>" or just "email@example.com"
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from.split('@')[0] ? from.trim() : null;
}

async function findVendorsByEmail(email) {
  try {
    const result = await pool.query(
      'SELECT id, name FROM vendors WHERE email = $1 ORDER BY id',
      [email]
    );
    return result.rows;
  } catch (err) {
    logger.error('Error finding vendors by email:', err);
    return [];
  }
}

async function findRfpBySubject(subject) {
  try {
    // Look for RFP title in subject
    const result = await pool.query(
      `SELECT id, title FROM rfps 
       WHERE LOWER(title) ILIKE CONCAT('%', $1, '%')
       OR LOWER($1) ILIKE CONCAT('%', LOWER(title), '%')
       ORDER BY created_at DESC LIMIT 1`,
      [subject]
    );
    return result.rows[0];
  } catch (err) {
    logger.error('Error finding RFP by subject:', err);
    return null;
  }
}

router.post('/email', async (req, res) => {
  try {
    // Optional: Verify webhook signature (requires SENDGRID_WEBHOOK_KEY in .env)
    if (process.env.SENDGRID_WEBHOOK_KEY && !verifyWebhookSignature(req)) {
      logger.warn('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { from, subject, text, html, to, headers } = req.body;

    if (!from || !subject || (!text && !html)) {
      logger.warn('Incomplete email data received:', { from, subject });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    logger.info(`📧 Email received from ${from} for ${to}`);
    logger.info(`   Subject: ${subject}`);

    // 1. Extract vendor email
    const vendorEmail = extractVendorEmail(from);
    if (!vendorEmail) {
      logger.warn('Could not extract vendor email from:', from);
      return res.status(400).json({ error: 'Invalid sender email' });
    }

    // 2. Find ALL vendors with this email (multiple vendors can share email)
    const vendors = await findVendorsByEmail(vendorEmail);
    if (!vendors.length) {
      logger.warn(`No vendors found for email: ${vendorEmail}`);
      return res.status(404).json({ error: 'Vendor not registered' });
    }

    logger.info(`✓ Found ${vendors.length} vendor(s) for email: ${vendorEmail}`);
    vendors.forEach(v => logger.info(`  - ${v.name} (ID: ${v.id})`));

    // 3. Parse email body to extract RFP ID or vendor ID if specified
    const proposalText = parseEmailBody(html, text);
    if (!proposalText || proposalText.length < 20) {
      logger.warn('Email body too short or empty');
      return res.status(400).json({ error: 'Email body too short' });
    }

    logger.info(`✓ Extracted ${proposalText.length} characters from email`);

    // 4. Try to extract RFP ID or vendor ID from email body
    // Format: "RFP_ID: 5" or "VENDOR_ID: 2" at start of email
    const rfpIdMatch = proposalText.match(/^RFP[_\s]*ID[\s:]*(\d+)/im);
    const vendorIdMatch = proposalText.match(/^VENDOR[_\s]*ID[\s:]*(\d+)/im);
    
    let targetRfpId = rfpIdMatch ? parseInt(rfpIdMatch[1]) : null;
    let targetVendorId = vendorIdMatch ? parseInt(vendorIdMatch[1]) : null;

    // If vendor ID specified, use that; otherwise use all found vendors
    let selectedVendors = targetVendorId 
      ? vendors.filter(v => v.id === targetVendorId)
      : vendors;

    if (!selectedVendors.length) {
      logger.warn(`Specified vendor ID ${targetVendorId} not found for this email`);
      return res.status(404).json({ error: 'Specified vendor not found' });
    }

    // 5. Find RFP by subject OR by specified RFP_ID
    let rfp = null;
    
    if (targetRfpId) {
      // Use specified RFP ID
      const rfpQ = await pool.query('SELECT id, title FROM rfps WHERE id = $1', [targetRfpId]);
      rfp = rfpQ.rows[0];
      if (!rfp) {
        logger.warn(`RFP with ID ${targetRfpId} not found`);
        return res.status(404).json({ error: 'RFP not found' });
      }
    } else {
      // Try to match by subject line
      rfp = await findRfpBySubject(subject);
      if (!rfp) {
        logger.warn(`RFP not found matching subject: ${subject}`);
        return res.status(400).json({ 
          error: 'RFP not found. Specify RFP_ID in email body or subject',
          hint: 'Start email with: RFP_ID: 5'
        });
      }
    }

    logger.info(`✓ Found RFP: ${rfp.title} (ID: ${rfp.id})`);

    // 6. Use AI to parse proposal
    logger.info('🤖 Parsing proposal with AI...');
    const parsed = await aiService.parseProposalText(proposalText);

    logger.info(`✓ AI parsing complete. Score: ${parsed.ai_score}/100`);

    // 7. Save proposals for each selected vendor
    const savedProposals = [];

    for (const vendor of selectedVendors) {
      logger.info(`💾 Saving proposal for vendor: ${vendor.name} (ID: ${vendor.id})`);

      const insertResult = await pool.query(
        `INSERT INTO proposals 
         (rfp_id, vendor_id, proposal_json, total, line_items, terms, ai_score, ai_feedback, raw_text) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          rfp.id,
          vendor.id,
          JSON.stringify(parsed.json_data || {}),
          parsed.total_price || null,
          JSON.stringify(parsed.line_items || []),
          parsed.terms || '',
          parsed.ai_score || 0,
          parsed.ai_feedback || '',
          proposalText
        ]
      );

      const proposalId = insertResult.rows[0].id;
      
      // Log the email send
      await pool.query(
        `INSERT INTO email_sends (rfp_id, vendor_id, sent_at, status)
         VALUES ($1, $2, NOW(), $3)`,
        [rfp.id, vendor.id, 'response_received']
      );

      savedProposals.push({
        proposalId,
        vendorId: vendor.id,
        vendorName: vendor.name,
        score: parsed.ai_score
      });

      logger.info(`✓ Proposal saved (ID: ${proposalId})`);
    }

    // Success response
    res.json({
      success: true,
      message: `Proposal(s) received and parsed for ${selectedVendors.length} vendor(s)`,
      rfp: {
        id: rfp.id,
        title: rfp.title
      },
      proposals: savedProposals
    });

    logger.info(`✅ Email processing complete. Saved ${savedProposals.length} proposal(s)`);

  } catch (err) {
    logger.error('❌ Webhook error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

router.post('/manual-response', async (req, res) => {
  try {
    const { vendorId, rfpId, emailBody, vendorEmail } = req.body;

    // Option 1: Use provided vendorId & rfpId
    if (vendorId && rfpId && emailBody) {
      logger.info(`📧 Processing manual response`);
      logger.info(`   Vendor ID: ${vendorId}, RFP ID: ${rfpId}`);

      // Verify vendor exists
      const vendorRes = await pool.query(
        'SELECT id, name FROM vendors WHERE id = $1',
        [vendorId]
      );

      if (!vendorRes.rows.length) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      const vendor = vendorRes.rows[0];

      // Verify RFP exists
      const rfpRes = await pool.query(
        'SELECT id, title FROM rfps WHERE id = $1',
        [rfpId]
      );

      if (!rfpRes.rows.length) {
        return res.status(404).json({ error: 'RFP not found' });
      }

      const rfp = rfpRes.rows[0];

      logger.info(`✓ Found vendor: ${vendor.name}`);
      logger.info(`✓ Found RFP: ${rfp.title}`);

      // Parse the email body with AI
      logger.info('🤖 Parsing proposal with AI...');
      const parsed = await aiService.parseProposalText(emailBody);

      logger.info(`✓ AI parsing complete. Score: ${parsed.ai_score}/100`);

      // Save to database
      const insertResult = await pool.query(
        `INSERT INTO proposals 
         (rfp_id, vendor_id, proposal_json, total, line_items, terms, ai_score, ai_feedback, raw_text) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          rfpId,
          vendorId,
          JSON.stringify(parsed.json_data || {}),
          parsed.total_price || null,
          JSON.stringify(parsed.line_items || []),
          parsed.terms || '',
          parsed.ai_score || 0,
          parsed.ai_feedback || '',
          emailBody
        ]
      );

      const proposalId = insertResult.rows[0].id;
      logger.info(`✓ Proposal saved to database (ID: ${proposalId})`);

      // Log the response
      await pool.query(
        `INSERT INTO email_sends (rfp_id, vendor_id, sent_at, status)
         VALUES ($1, $2, NOW(), $3)`,
        [rfpId, vendorId, 'response_received']
      );

      res.json({
        success: true,
        message: 'Proposal manually processed and saved',
        proposal: {
          id: proposalId,
          vendor: vendor.name,
          rfp: rfp.title,
          score: parsed.ai_score,
          total: parsed.total_price
        }
      });

      logger.info(`✅ Manual processing complete for proposal ${proposalId}`);
    }
    // Option 2: Look up by vendor email (for multiple vendors with same email)
    else if (vendorEmail && rfpId && emailBody) {
      logger.info(`📧 Processing manual response for email: ${vendorEmail}`);

      // Find all vendors with this email
      const vendorRes = await pool.query(
        'SELECT id, name FROM vendors WHERE email = $1 ORDER BY id',
        [vendorEmail]
      );

      if (!vendorRes.rows.length) {
        return res.status(404).json({ error: 'No vendors found with this email' });
      }

      const vendors = vendorRes.rows;
      logger.info(`✓ Found ${vendors.length} vendor(s) for email: ${vendorEmail}`);

      // Verify RFP exists
      const rfpRes = await pool.query(
        'SELECT id, title FROM rfps WHERE id = $1',
        [rfpId]
      );

      if (!rfpRes.rows.length) {
        return res.status(404).json({ error: 'RFP not found' });
      }

      const rfp = rfpRes.rows[0];
      logger.info(`✓ Found RFP: ${rfp.title}`);

      // Parse the email body with AI
      logger.info('🤖 Parsing proposal with AI...');
      const parsed = await aiService.parseProposalText(emailBody);

      logger.info(`✓ AI parsing complete. Score: ${parsed.ai_score}/100`);

      // Save proposals for ALL vendors with this email
      const savedProposals = [];

      for (const vendor of vendors) {
        logger.info(`💾 Saving proposal for vendor: ${vendor.name} (ID: ${vendor.id})`);

        const insertResult = await pool.query(
          `INSERT INTO proposals 
           (rfp_id, vendor_id, proposal_json, total, line_items, terms, ai_score, ai_feedback, raw_text) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [
            rfpId,
            vendor.id,
            JSON.stringify(parsed.json_data || {}),
            parsed.total_price || null,
            JSON.stringify(parsed.line_items || []),
            parsed.terms || '',
            parsed.ai_score || 0,
            parsed.ai_feedback || '',
            emailBody
          ]
        );

        const proposalId = insertResult.rows[0].id;

        // Log the response
        await pool.query(
          `INSERT INTO email_sends (rfp_id, vendor_id, sent_at, status)
           VALUES ($1, $2, NOW(), $3)`,
          [rfpId, vendor.id, 'response_received']
        );

        savedProposals.push({
          proposalId,
          vendorId: vendor.id,
          vendorName: vendor.name,
          score: parsed.ai_score
        });

        logger.info(`✓ Proposal saved (ID: ${proposalId})`);
      }

      res.json({
        success: true,
        message: `Proposal(s) processed for ${vendors.length} vendor(s)`,
        rfp: {
          id: rfp.id,
          title: rfp.title
        },
        proposals: savedProposals
      });

      logger.info(`✅ Manual processing complete. Saved ${savedProposals.length} proposal(s)`);
    }
    else {
      return res.status(400).json({
        error: 'Missing required fields',
        options: [
          {
            name: 'Option 1: Specific vendor',
            required: ['vendorId', 'rfpId', 'emailBody']
          },
          {
            name: 'Option 2: Multiple vendors with same email',
            required: ['vendorEmail', 'rfpId', 'emailBody']
          }
        ]
      });
    }

  } catch (err) {
    logger.error('❌ Manual response error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

router.get('/email/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Email webhook is running',
    endpoint: '/api/webhooks/email',
    method: 'POST'
  });
});

module.exports = router;
