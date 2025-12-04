#!/usr/bin/env node

const { Pool } = require('pg');
const emailService = require('./services/emailService');
require('dotenv').config();

async function testEmailSending() {
  console.log('\n🔍 Testing Email Configuration...\n');

  // Check environment variables
  console.log('📋 Configuration Check:');
  console.log(`   SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '✓ Set' : '❌ Missing'}`);
  console.log(`   FROM_EMAIL: ${process.env.FROM_EMAIL ? '✓ Set (' + process.env.FROM_EMAIL + ')' : '❌ Missing'}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✓ Set' : '❌ Missing'}`);

  if (!process.env.SENDGRID_API_KEY) {
    console.log('\n❌ SendGrid API key not configured!');
    console.log('   Add SENDGRID_API_KEY to .env file');
    return;
  }

  if (!process.env.FROM_EMAIL) {
    console.log('\n❌ FROM_EMAIL not configured!');
    console.log('   Add FROM_EMAIL to .env file');
    return;
  }

  // Connect to database
  console.log('\n📊 Fetching test data...\n');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Get sample RFP
    const rfpsRes = await pool.query('SELECT * FROM rfps LIMIT 1');
    const vendorsRes = await pool.query('SELECT * FROM vendors LIMIT 1');

    if (!rfpsRes.rows.length) {
      console.log('❌ No RFPs in database. Create an RFP first!');
      await pool.end();
      return;
    }

    if (!vendorsRes.rows.length) {
      console.log('❌ No vendors in database. Create a vendor first!');
      await pool.end();
      return;
    }

    const rfp = rfpsRes.rows[0];
    const vendor = vendorsRes.rows[0];

    console.log(`✓ Found RFP: "${rfp.title || 'Untitled'}" (ID: ${rfp.id})`);
    console.log(`✓ Found Vendor: "${vendor.name}" (${vendor.email})`);

    // Test email sending
    console.log('\n📧 Attempting to send test email...\n');

    try {
      await emailService.sendRfpEmail({
        to: vendor.email,
        rfpData: rfp,
        vendorName: vendor.name
      });

      console.log('✅ Email sent successfully!');
      console.log(`   To: ${vendor.email}`);
      console.log(`   Subject: RFP Request: ${rfp.title || 'Procurement Request'}`);
      console.log('\n📬 Check your email inbox or SendGrid dashboard to confirm delivery.');
    } catch (err) {
      console.log('❌ Failed to send email:');
      console.log(`   Error: ${err.message}`);
    }
  } catch (err) {
    console.log('❌ Database error:');
    console.log(`   ${err.message}`);
  } finally {
    await pool.end();
  }

  console.log('\n');
}

testEmailSending();
