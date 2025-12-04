# 📧 RFP Email & Proposal Workflow Guide

## **System Overview**

Your RFP system now has **two ways** for vendors to respond:

### **Method 1: Email Reply (Realistic Production Setup)**
- Buyer sends RFP via email
- Vendor replies to the email with their proposal
- System receives email via webhook and parses it
- AI scores the proposal automatically

### **Method 2: Web Portal (What we have now for testing)**
- Buyer sends RFP via email (notification)
- Vendor visits your web app → "Vendor Portal"
- Vendor submits proposal through web form
- AI scores immediately
- ✅ **This is what you can test RIGHT NOW**

---

## 🚀 **How to Test the Full Workflow**

### **Step 1: Create an RFP (as Buyer)**
```
1. Open http://localhost:5173
2. Click "Create RFP" tab
3. Choose "Manual Entry" or "AI Parser"
4. Fill in details:
   - Title: "Laptop Procurement"
   - Budget: $50,000
   - Delivery: 30 days
   - Items: 20 Laptops with 16GB RAM
5. Click "Create RFP"
```

### **Step 2: Add Vendors**
```
1. Click "Vendors" tab
2. Add some vendors:
   - Tech Supply Co. (tech@supply.com)
   - Digital Solutions Inc. (sales@digital.com)
3. Set ratings & categories
```

### **Step 3: Send RFP Email**
```
1. Click "Send & Track" tab
2. Click "Send RFP to Vendors" section
3. Select your RFP
4. Select vendors to send to
5. Click "Send to X Vendors"
✅ Emails sent! (Check your email logs in SendGrid)
```

### **Step 5: Compare Proposals**
```
1. Back to Buyer dashboard
2. Click "Send & Track" tab
3. Click "Compare Proposals" section
4. Select RFP
5. View all proposals ranked by AI score
✅ See which vendor has best offer!
```

---

## 📝 **Sample Proposal Text**

Copy and paste this into the Vendor Portal when submitting:

```
We are pleased to submit our proposal for the Laptop Procurement RFP.

PRICING:
- Unit price: $2,400 per laptop
- Quantity: 20 laptops
- Total: $48,000 (2% below budget)

SPECIFICATIONS:
- All units will have Intel i7 processors
- 16GB DDR4 RAM as specified
- 512GB SSD storage
- 15.6" FHD displays

DELIVERY & TERMS:
- Delivery timeline: 25 days (5 days ahead of schedule)
- Payment terms: Net 30
- Warranty: 2-year hardware warranty included
- Support: Free technical support for 1 year
- Delivery method: FOB destination with tracking

SPECIAL OFFERS:
- Free Microsoft Office 365 licenses (1-year)
- Free antivirus software pre-installed
- Bulk discount already applied (saves you $800)

We are confident in our ability to meet your requirements and timeline.
Best regards,
Tech Supply Co.
```

---

## 🤖 **What Happens When Vendor Submits**

### **Behind the Scenes:**

1. **Proposal received** via web form
2. **Groq AI parses** the text and extracts:
   - Total price ($48,000)
   - Line items (20 × Laptop @ $2,400)
   - Terms (Net 30, 2-year warranty)
3. **AI scoring** compares against RFP:
   - Budget match: ✓ Under budget = +20 points
   - Delivery: ✓ Faster than needed = +15 points
   - Completeness: ✓ All details included = +30 points
   - Vendor rating: ✓ Good history = +10 points
   - **Total Score: 75-90/100**
4. **Feedback generated**: "Best price with solid warranty"
5. **Saved to database** with full audit trail

### **What Buyer Sees:**

In "Compare Proposals":
```
✓ Tech Supply Co.  [████████░] 85/100
  Price: $48,000 | Delivery: 25 days | 2-year warranty
  💡 AI Insight: Best price with solid warranty

✓ Digital Solutions [██████░░░] 72/100
  Price: $52,000 | Delivery: 30 days | 1-year warranty
  💡 AI Insight: Good options but higher cost
```

---

## 📧 **Future: Real Email Replies (Advanced Setup)**

To accept vendor replies via email:

1. **Set up SendGrid Inbound Parse Webhook:**
   - Configure webhook in SendGrid dashboard
   - Point to: `http://yourdomain.com/api/webhooks/email`

2. **Add webhook handler** (we can add later):
```javascript
POST /api/webhooks/email
{
  from: vendor@company.com,
  subject: "Re: RFP Request: Laptop Procurement",
  text: "We can supply 20 laptops for $48,000..."
}
```

3. **System will:**
   - Parse sender email → match to vendor
   - Extract proposal text from email body
   - Auto-submit through proposals API
   - Score and save same as web form

---

## ✅ **Checklist for Testing**

- [ ] Backend running: `npm run dev` in `/backend`
- [ ] Frontend running: `npm run dev` in `/frontend`
- [ ] Database initialized: Tables created
- [ ] GROQ_API_KEY set in `.env`
- [ ] SENDGRID_API_KEY set in `.env`
- [ ] Create an RFP
- [ ] Add 2+ vendors
- [ ] Send RFP to vendors
- [ ] Switch to Vendor Portal
- [ ] Submit proposal as vendor
- [ ] View proposals in Compare section
- [ ] Check AI scores and feedback

---

## 🎯 **Key Endpoints**

### **Buyer APIs:**
```
POST   /api/rfps                    - Create RFP
POST   /api/send-rfp                - Send RFP to vendors
GET    /api/send-rfp/history/:id    - See send history
GET    /api/proposals/compare/:id   - Compare proposals
```

### **Vendor APIs:**
```
GET    /api/rfps                    - See available RFPs
POST   /api/send-rfp/response       - Submit proposal
```

---

## 💡 **Tips**

1. **For testing**, use the Vendor Portal (no email setup needed)
2. **Real vendors** will eventually reply via email
3. **AI parsing** works with any proposal format (conversational text)
4. **Scores are automatic** — no manual review needed
5. **All data saved** — 100% audit trail with timestamps

---

## 🚨 **Troubleshooting**

**"Email not sending?"**
- Check SendGrid API key in `.env`
- Check FROM_EMAIL is valid
- Check vendor email is correct

**"AI not scoring?"**
- Check GROQ_API_KEY in `.env`
- Falls back to heuristic scoring if API fails
- Check backend logs

**"Vendor can't find RFP?"**
- Make sure RFP was created
- Make sure it's in "active" status
- Check database directly

---

**Ready to test? Let's go! 🚀**
