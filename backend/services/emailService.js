const sgMail = require('@sendgrid/mail');
const logger = require('../logger');
require('dotenv').config();

const API_KEY = process.env.SENDGRID_API_KEY;
const FROM = process.env.FROM_EMAIL || 'noreply@rfpmanager.io';
const REPLY_TO = process.env.SENDGRID_INBOUND_EMAIL || process.env.REPLY_TO || '';

if (!API_KEY) {
  logger.warn('SENDGRID_API_KEY not set. Email sending will fail until configured.');
} else {
  sgMail.setApiKey(API_KEY);
}

async function sendRfpEmail({ to, rfpData, vendorName, vendorId }) {
  if (!API_KEY) throw new Error('SendGrid API key not configured');

  const subject = `RFP Request: ${rfpData.title || 'Procurement Request'}`;
  

  console.log("We are here yehh")
  const htmlBody = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">RFP Request</h2>
          <p>Dear ${vendorName},</p>
          
          <p>We would like to request your proposal for the following Request for Proposal (RFP):</p>
          
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin-top: 0; color: #111827;">${rfpData.title || 'Untitled RFP'}</h3>
            <p><strong>Description:</strong></p>
            <p>${rfpData.description || 'N/A'}</p>
            
            ${rfpData.budget ? `<p><strong>Budget:</strong> $${rfpData.budget}</p>` : ''}
            ${rfpData.delivery_days ? `<p><strong>Delivery Timeline:</strong> ${rfpData.delivery_days} days</p>` : ''}
            ${rfpData.category ? `<p><strong>Category:</strong> ${rfpData.category}</p>` : ''}
            
            ${rfpData.items && rfpData.items.length ? `
              <p><strong>Items Needed:</strong></p>
              <ul>
                ${rfpData.items.map(item => `<li>${item.qty}x ${item.name}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
          
          <p><strong>Please respond with your proposal including:</strong></p>
          <ul>
            <li>Itemized pricing</li>
            <li>Delivery timeline and terms</li>
            <li>Any special offers or bundles</li>
            <li>Payment terms (Net 30, Net 60, etc.)</li>
            <li>Warranty and support details</li>
          </ul>
          
          <p>Please reply to this email with your proposal as soon as possible.</p>
          
          <div style="background:#fff7ed;border-left:4px solid #f59e0b;padding:12px;border-radius:6px;margin-top:12px;">
            <p style="margin:0 0 6px 0;font-weight:600;color:#92400e;">Reply Instructions</p>
            <p style="margin:0 0 6px 0;color:#92400e;font-size:13px;">For automatic processing, please reply using the Reply button so the subject is preserved. We have set the reply-to address to <strong>${REPLY_TO || FROM}</strong>. If you must change the subject, please start your message with <code>RFP_ID: ${rfpData.id || 'N/A'}</code> to help us match your proposal.</p>
            <p style="margin:0;color:#92400e;font-size:12px;">If you represent multiple vendor records with the same email, please include <code>VENDOR_ID: ${vendorId || '<your vendor id>'}</code> on the first line of your reply so we can attribute your proposal correctly.</p>
          </div>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <p>This is an automated message from RFP Manager. Please do not reply to this address directly if you have an issue.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const msg = {
    to,
    from: FROM,
    subject,
    text: `RFP Request: ${rfpData.title}\n\n${rfpData.description}`,
    html: htmlBody,
    replyTo: REPLY_TO || FROM
  };

  try {
    console.log("Sending email to ", to);
    const res = await sgMail.send(msg);
    console.log(res)
    logger.info('RFP email sent', { to, subject, rfpId: rfpData.id });
    return res;
  } catch (err) {
    console.log("Error sending email", err);
    logger.error('Error sending RFP email', { err: err.message, to });
    throw err;
  }
}

async function sendProposalAcknowledgment({ to, vendorName, rfpTitle }) {
  if (!API_KEY) throw new Error('SendGrid API key not configured');

  const subject = `Proposal Received: ${rfpTitle}`;
  const htmlBody = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">✓ Proposal Received</h2>
          <p>Dear ${vendorName},</p>
          <p>Thank you for submitting your proposal for <strong>${rfpTitle}</strong>.</p>
          <p>We have received and are reviewing your submission. We will contact you shortly with next steps.</p>
          <p>Best regards,<br>RFP Manager Team</p>
        </div>
      </body>
    </html>
  `;

  const msg = {
    to,
    from: FROM,
    subject,
    html: htmlBody
  };

  try {
    await sgMail.send(msg);
    logger.info('Acknowledgment email sent', { to, rfpTitle });
  } catch (err) {
    logger.warn('Failed to send acknowledgment', { err: err.message });
  }
}

module.exports = { sendRfpEmail, sendProposalAcknowledgment };
