# SendGrid Inbound Parse Setup Guide

## Overview

This guide shows how to set up SendGrid's **Inbound Parse webhook** so vendors' email replies are automatically received, parsed with AI, and stored in your database.

## How It Works

```
Vendor sends email reply
        ↓
SendGrid receives email
        ↓
Triggers webhook → POST /api/webhooks/email
        ↓
Email parsed & cleaned
        ↓
AI extracts proposal data (price, terms, timeline)
        ↓
Saved to database with AI score (0-100)
        ↓
Visible in Compare Proposals dashboard
```

## Prerequisites

- SendGrid account with Inbound Parse enabled (may require Business Plan)
- Backend server publicly accessible (or use ngrok for testing)
- Domain name (or subdomain) you control

## Setup Steps

### Step 1: Prepare Your Server

Make sure your backend is running:

```powershell
cd backend
npm run dev
```

The webhook endpoint is: `POST /api/webhooks/email`

### Step 2: Make Backend Public (For Testing)

If running locally, use **ngrok** to expose your server:

```powershell
# Install ngrok from https://ngrok.com/download
ngrok http 4000
```

This gives you a public URL like: `https://abc123.ngrok.io`

Your webhook URL would be: `https://abc123.ngrok.io/api/webhooks/email`

### Step 3: Configure SendGrid Inbound Parse

1. **Log in to SendGrid Dashboard** → https://app.sendgrid.com
2. **Settings** → **Inbound Parse**
3. Click **Add Host**

Fill in:
- **Hostname**: `replies.yourdomain.com` or `inbound.yourdomain.com`
  - *(You'll need to add MX records to your DNS)*
- **URL**: `https://your-server.com/api/webhooks/email`
- **Post the raw, full SMTP message**: ✓ (checked)

4. Click **Add**

### Step 4: Configure DNS Records

For your chosen hostname (e.g., `replies.yourdomain.com`), add these MX records:

```
Priority  Host
10        replies.yourdomain.com
20        mx.sendgrid.net
```

**Note**: This requires access to your domain registrar (GoDaddy, Namecheap, etc.)

### Step 5: Test Email Receiving

Once DNS is configured, send an email to: `reply@replies.yourdomain.com`

Content example:
```
Subject: RFP Request: Cloud Migration Project

Dear Team,

We are interested in your RFP. Here is our proposal:

**Service Description**: Cloud Infrastructure Setup
**Total Cost**: $15,000
**Timeline**: 30 days
**Terms**: Net 30, includes 90-day support

Best regards,
Acme Corp
```

Check your backend logs:
```
📧 Email received from vendor@acmecorp.com for reply@replies.yourdomain.com
   Subject: RFP Request: Cloud Migration Project
✓ Found vendor: Acme Corp (ID: 1)
✓ Found RFP: Cloud Migration Project (ID: 5)
✓ Extracted 287 characters from email
🤖 Parsing proposal with AI...
✓ AI parsing complete. Score: 85/100
✓ Proposal saved to database (ID: 42)
```

### Step 6: View in Dashboard

1. Go to frontend: `http://localhost:5173`
2. Navigate to **Send RFP** → **Compare Proposals**
3. Select the RFP
4. See the proposal with AI score and parsed data

## Testing Without Domain Setup

For immediate testing without domain configuration:

### Option A: Use Vendor Portal Form (Quick)
- Frontend has `VendorPortal` component
- Vendors fill form instead of sending email
- Data processed identically

### Option B: Test Webhook Directly (For Developers)

Use curl to simulate an email:

```powershell
# PowerShell
$body = @{
    from = "vendor@acmecorp.com"
    subject = "RFP Request: Cloud Migration"
    text = "Service: Cloud Setup`nCost: $15,000`nTimeline: 30 days"
    to = "reply@yourdomain.com"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:4000/api/webhooks/email" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

## Webhook Security (Optional)

To enable webhook signature verification:

1. Go to SendGrid Dashboard → Settings → Inbound Parse
2. Find your webhook entry
3. Copy the **Webhook Signing Secret**
4. Add to `.env`:
   ```
   SENDGRID_WEBHOOK_KEY=your_signing_secret_here
   ```

5. Uncomment the verification in `routes/webhooks.js`:
   ```javascript
   if (process.env.SENDGRID_WEBHOOK_KEY && !verifyWebhookSignature(req)) {
     return res.status(401).json({ error: 'Invalid signature' });
   }
   ```

## How the AI Parser Works

The webhook automatically:

1. **Extracts vendor email** from the "From" header
2. **Looks up vendor** in database
3. **Matches email subject** to RFP title
4. **Cleans email body** (removes signatures, footers, HTML)
5. **Uses Groq AI** to extract:
   - Total price / cost breakdown
   - Timeline / delivery
   - Terms and conditions
   - Service description
6. **Scores proposal** 0-100 based on completeness & clarity
7. **Stores in database** with AI feedback

## Email Subject Matching

The system matches RFP by subject line similarity. Examples:

```
Email Subject: "RE: RFP - Cloud Migration"
Matches RFPs with titles like:
  - "Cloud Migration Project"
  - "RFP Request: Cloud Services"
  - "Procurement: Cloud Migration"
```

To improve matching, ask vendors to reply with:
- "RFP: [Your RFP Title]" in subject
- Or simply reply to your email (RE: is preserved)

## Troubleshooting

### "Vendor not found" Error
- Check vendor email in database matches exactly
- Case-sensitive matching
- Verify vendor was created in database

### "RFP not found" Error
- Email subject must contain RFP title
- Example: Email subject "RE: Cloud Migration" matches RFP "Cloud Migration Project"
- Update email subject to include RFP title

### "Email body too short" Error
- Proposal text must be > 20 characters
- Avoid single-line emails
- Include proposal details in email body

### Webhook Not Receiving Emails
- Check ngrok tunnel is running (if local testing)
- Verify DNS MX records are configured
- Check SendGrid Inbound Parse logs in dashboard
- Ensure webhook URL is correct

### "Invalid signature" Error
- SENDGRID_WEBHOOK_KEY is incorrect
- Copy from SendGrid dashboard exactly
- Or disable signature verification for testing

## File References

- **Webhook Handler**: `backend/routes/webhooks.js`
- **Server Integration**: `backend/server.js` (line with `/api/webhooks`)
- **AI Parser**: `backend/services/aiService.js`
- **Database Schema**: `backend/init.sql` (proposals table)

## Next Steps

1. **Set up domain** and MX records
2. **Configure SendGrid Inbound Parse**
3. **Send test email** from vendor
4. **View parsed proposal** in dashboard
5. **Compare multiple proposals** with AI scoring

---

**Questions?** Check backend logs for detailed error messages:
```powershell
Get-Content -Path backend/logs/application.log -Tail 20
```
