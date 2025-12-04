const sgMail = require('@sendgrid/mail');
const logger = require('../logger');
require('dotenv').config();

const API_KEY = process.env.SENDGRID_API_KEY;
const FROM = process.env.FROM_EMAIL;

if (!API_KEY) {
  logger.warn('SENDGRID_API_KEY not set. Email sending will fail until configured.');
} else {
  sgMail.setApiKey(API_KEY);
}

async function sendRfpEmail({ to, subject, text, html }) {
  if (!API_KEY) throw new Error('SendGrid API key not configured');
  const msg = {
    to,
    from: FROM,
    subject,
    text,
    html
  };
  try {
    const res = await sgMail.send(msg);
    logger.info('Email sent', { to, subject });
    return res;
  } catch (err) {
    logger.error('Error sending email', { err: err.message, to });
    throw err;
  }
}

module.exports = { sendRfpEmail };
