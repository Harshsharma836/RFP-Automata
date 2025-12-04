#!/usr/bin/env node

const http = require('http');
require('dotenv').config();

async function testEmailWebhook() {
  console.log('\n🧪 Testing Email Webhook...\n');

  // Get sample data from database first
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Get sample RFP and vendor
    const rfpRes = await pool.query('SELECT id, title FROM rfps LIMIT 1');
    const vendorRes = await pool.query('SELECT id, email, name FROM vendors LIMIT 1');

    if (!rfpRes.rows.length || !vendorRes.rows.length) {
      console.log('❌ Need at least one RFP and one vendor to test');
      console.log('   Create them in the UI first');
      await pool.end();
      return;
    }

    const rfp = rfpRes.rows[0];
    const vendor = vendorRes.rows[0];

    console.log(`📄 Test RFP: ${rfp.title} (ID: ${rfp.id})`);
    console.log(`👤 Test Vendor: ${vendor.name} <${vendor.email}> (ID: ${vendor.id})`);
    console.log('');

    // Simulate a vendor proposal email
    const proposalEmail = {
      from: `"${vendor.name}" <${vendor.email}>`,
      to: 'reply@yourdomain.com',
      subject: `RE: RFP - ${rfp.title}`,
      text: `Hello,

Thank you for the RFP. We are pleased to submit our proposal:

**Service Scope:**
We will provide complete project delivery with dedicated team support.

**Cost Breakdown:**
- Development: $12,000
- Deployment: $3,000
- Support (3 months): $2,000
Total: $17,000

**Timeline:**
- Phase 1 (Planning): Week 1-2
- Phase 2 (Development): Week 3-8
- Phase 3 (Testing & Deployment): Week 9-10

**Terms:**
- Payment: 50% upfront, 50% on completion
- Warranty: 90 days
- Support: Included in contract

Best regards,
${vendor.name}
Team Lead`,
      html: `<html><body>
<p>Hello,</p>
<p>Thank you for the RFP. We are pleased to submit our proposal:</p>
<p><strong>Service Scope:</strong><br>
We will provide complete project delivery with dedicated team support.</p>
<p><strong>Cost Breakdown:</strong><br>
- Development: $12,000<br>
- Deployment: $3,000<br>
- Support (3 months): $2,000<br>
Total: $17,000</p>
<p><strong>Timeline:</strong><br>
- Phase 1 (Planning): Week 1-2<br>
- Phase 2 (Development): Week 3-8<br>
- Phase 3 (Testing & Deployment): Week 9-10</p>
<p><strong>Terms:</strong><br>
- Payment: 50% upfront, 50% on completion<br>
- Warranty: 90 days<br>
- Support: Included in contract</p>
<p>Best regards,<br>
${vendor.name}<br>
Team Lead</p>
</body></html>`
    };

    const payload = JSON.stringify(proposalEmail);

    console.log('📧 Sending simulated email webhook...\n');
    console.log(`   From: ${proposalEmail.from}`);
    console.log(`   Subject: ${proposalEmail.subject}`);
    console.log(`   Body length: ${proposalEmail.text.length} chars\n`);

    // Send webhook request
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/webhooks/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-Twilio-Email-Event-Webhook-Signature': 'test-signature', // For testing
        'X-Twilio-Email-Event-Webhook-Timestamp': Date.now().toString()
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`Response Status: ${res.statusCode}\n`);

        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log('✅ Email webhook succeeded!\n');
            console.log('📊 Parsed Proposal:');
            console.log(`   Vendor: ${response.proposal.vendor}`);
            console.log(`   RFP: ${response.proposal.rfp}`);
            console.log(`   AI Score: ${response.proposal.score}/100`);
            console.log(`   Total: $${response.proposal.total || 'N/A'}`);
            console.log(`   Proposal ID: ${response.proposal.id}`);
            console.log('\n💡 Check "Compare Proposals" in the UI to see the parsed data!');
          } else {
            console.log('❌ Webhook failed:', response.error);
          }
        } catch (e) {
          console.log('Response:', data);
        }

        console.log('\n');
      });
    });

    req.on('error', (e) => {
      console.log(`❌ Connection error: ${e.message}`);
      console.log('   Make sure backend is running on port 4000\n');
    });

    // Send data
    req.write(payload);
    req.end();

    // Keep process alive for response
    setTimeout(() => {
      pool.end();
    }, 2000);

  } catch (err) {
    console.log('❌ Error:', err.message);
    await pool.end();
  }
}

testEmailWebhook();
