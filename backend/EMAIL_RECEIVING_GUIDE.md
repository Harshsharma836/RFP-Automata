# Email Receiving & Parsing Workflow

## ✅ What You Now Have

Your system now automatically:

1. **Receives** vendor email replies via SendGrid Inbound Parse webhook
2. **Parses** the email with AI (extracts price, timeline, terms)
3. **Scores** the proposal (0-100) using Groq
4. **Stores** in database with all details
5. **Shows** in Compare Proposals dashboard

## 🚀 Quick Testing (Without Domain Setup)

### Method 1: Test Webhook Directly

```powershell
cd backend
node test-webhook.js
```

This simulates receiving an email from a vendor. Check your logs:

```
📧 Email received from vendor@company.com
✓ Found vendor: Company Name (ID: 1)
✓ Found RFP: RFP Title (ID: 5)
✓ Extracted 287 characters from email
🤖 Parsing proposal with AI...
✓ AI parsing complete. Score: 85/100
✓ Proposal saved to database
```

### Method 2: Use Vendor Portal Form

Frontend has VendorPortal component - vendors fill out a form instead of sending email. Same result!

## 🔧 Real Setup (With Domain)

### Prerequisites
- Your own domain (or subdomain)
- SendGrid account
- Access to domain DNS settings

### Step 1: Expose Backend Publicly

Use ngrok (free):

```powershell
# Download: https://ngrok.com/download
ngrok http 4000
```

Get public URL like: `https://abc123.ngrok.io`

### Step 2: Configure SendGrid

1. Login: https://app.sendgrid.com
2. Settings → Inbound Parse
3. Add Host:
   - **Hostname**: `replies.yourdomain.com`
   - **URL**: `https://abc123.ngrok.io/api/webhooks/email`
   - ✓ Post the raw SMTP message

### Step 3: Add DNS Records

At your domain registrar, add MX records for `replies.yourdomain.com`:

```
10  replies.yourdomain.com
20  mx.sendgrid.net
```

### Step 4: Test

Send email to: `reply@replies.yourdomain.com`

```
Subject: RE: RFP - Cloud Migration

We accept this RFP. Total cost: $15,000, timeline: 30 days.
```

Webhook triggers automatically → proposal parsed and saved!

## 📊 View Results

1. Frontend: http://localhost:5173
2. Navigate to: **Send RFP** → **Compare Proposals**
3. Select RFP → See vendor proposal with:
   - AI score (0-100)
   - Extracted cost
   - Parsed timeline
   - AI feedback
   - Comparison ranking

## 🔐 Security (Optional)

For production, enable webhook signature verification:

1. Copy Webhook Signing Secret from SendGrid
2. Add to `.env`:
   ```
   SENDGRID_WEBHOOK_KEY=sg.xxx...
   ```
3. Uncomment verification in `routes/webhooks.js`

## 📁 Files Created

- `backend/routes/webhooks.js` - Email webhook handler
- `backend/test-webhook.js` - Test script
- `SENDGRID_INBOUND_SETUP.md` - Complete setup guide

## 📝 Email Format Tips

For best results, vendor emails should include:

```
Subject: RE: [Your RFP Title]

**Total Cost**: $XXX
**Timeline**: XX days
**Terms**: Payment terms, warranty, support

[Project description and details]
```

AI automatically extracts structured data from this.

## 🐛 Troubleshooting

**"Vendor not found"**
- Check vendor email in database exactly matches sender

**"RFP not found"**
- Email subject must contain RFP title (use RE: to preserve)

**Email not received**
- If using ngrok: keep tunnel running
- If using domain: check DNS MX records configured
- Check SendGrid dashboard for errors

**Webhook not triggering**
- Test locally: `node test-webhook.js`
- Check backend logs for errors

---

**Summary**: You can now receive vendor email responses automatically, parse them with AI, and compare all proposals in the dashboard! 🎉
