#!/usr/bin/env node

const http = require('http');
require('dotenv').config();

async function testManualResponse() {
  console.log('\n🧪 Testing Multi-Vendor Proposal Processing...\n');

  // Get vendor and RFP from database
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Find first vendor with any email
    const firstVendorRes = await pool.query(
      'SELECT id, email, name FROM vendors ORDER BY id LIMIT 1'
    );

    if (!firstVendorRes.rows.length) {
      console.log('❌ No vendors in database');
      await pool.end();
      return;
    }

    const firstVendor = firstVendorRes.rows[0];
    const sharedEmail = firstVendor.email;

    // Find ALL vendors with that email
    const vendorsRes = await pool.query(
      'SELECT id, email, name FROM vendors WHERE email = $1 ORDER BY id',
      [sharedEmail]
    );

    const vendors = vendorsRes.rows;

    // Get RFP
    const rfpRes = await pool.query(
      'SELECT id, title FROM rfps LIMIT 1'
    );

    if (!rfpRes.rows.length) {
      console.log('❌ No RFPs in database');
      await pool.end();
      return;
    }

    const rfp = rfpRes.rows[0];

    console.log(`📧 Found ${vendors.length} vendor(s) with email: ${sharedEmail}`);
    vendors.forEach((v, idx) => {
      console.log(`   ${idx + 1}. ${v.name} (ID: ${v.id})`);
    });
    console.log(`\n📄 RFP: ${rfp.title} (ID: ${rfp.id})\n`);

    // Sample vendor response
    const vendorResponseEmail = `Dear Client,

Thank you for the RFP. We are pleased to submit our comprehensive proposal:

SERVICE SCOPE:
Complete project delivery with dedicated support team

COST BREAKDOWN:
- Development & Implementation: $18,500
- Testing & QA: $4,200
- Training & Documentation: $2,800
Total: $25,500

PROJECT TIMELINE:
- Phase 1 (Planning): Week 1-2
- Phase 2 (Development): Week 3-8
- Phase 3 (Testing): Week 9-10
- Phase 4 (Deployment): Week 11

PAYMENT TERMS:
- 30% upfront on contract signing
- 40% on milestone completion
- 30% on final delivery and acceptance

WARRANTY & SUPPORT:
- 1-year comprehensive warranty included
- 24/7 email support included
- On-site support available at $250/day

Best regards,
Vendor Team`;

    const payload = JSON.stringify({
      vendorEmail: sharedEmail,
      rfpId: rfp.id,
      emailBody: vendorResponseEmail
    });

    console.log('📧 Sending multi-vendor proposal...\n');
    console.log(`Email from: ${sharedEmail}`);
    console.log(`RFP: ${rfp.title}`);
    console.log(`Will save to: ${vendors.length} vendor(s)\n`);

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/webhooks/manual-response',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
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
            console.log('✅ Proposals processed successfully!\n');
            console.log(`📊 Results:`);
            console.log(`   RFP: ${response.rfp.title}`);
            console.log(`   Proposals saved: ${response.proposals.length}\n`);
            
            response.proposals.forEach((p, idx) => {
              console.log(`   ${idx + 1}. ${p.vendorName} (Vendor ID: ${p.vendorId})`);
              console.log(`      Proposal ID: ${p.proposalId}`);
              console.log(`      AI Score: ${p.score}/100`);
            });

            console.log('\n💡 Now in frontend → Send RFP → Compare Proposals');
            console.log(`   Select RFP: "${response.rfp.title}"`);
            console.log(`   You should see ${response.proposals.length} proposal(s) with same score!`);
          } else {
            console.log('❌ Error:', response.error);
            if (response.details) {
              console.log(`   Details: ${response.details}`);
            }
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

    req.write(payload);
    req.end();

    setTimeout(() => {
      pool.end();
    }, 2000);

  } catch (err) {
    console.log('❌ Error:', err.message);
    await pool.end();
  }
}

testManualResponse();
