# Multi-Vendor & Multi-Proposal Webhook Guide

## 🎯 What Changed

Your webhook now supports:

✅ **Multiple vendors with same email address**
✅ **Multiple proposals from same vendor for different RFPs**
✅ **Flexible RFP matching** (by subject OR explicit RFP_ID)
✅ **Two processing methods** (automatic OR manual)

---

## 📧 Method 1: Automatic Email Webhook

### Single Vendor, One Proposal

```
Email From: vendor@company.com
Subject: RE: RFP - Cloud Migration Project

Our proposal for $45,000...
```

**What happens:**
1. ✓ Finds vendor by email
2. ✓ Matches RFP by subject line
3. ✓ Saves one proposal

### Multiple Vendors (Same Email) - Specify Vendor ID

```
Email From: team@agency.com
Subject: RE: RFP - Website Redesign

VENDOR_ID: 3

Our proposal for $25,000...
```

**What happens:**
1. ✓ Finds ALL vendors with email team@agency.com
2. ✓ Uses only vendor ID 3 (filters by VENDOR_ID: 3)
3. ✓ Matches RFP by subject
4. ✓ Saves one proposal for that vendor

### Multiple Vendors - No Filtering (All Get Same Proposal)

```
Email From: team@agency.com
Subject: RE: RFP - Website Redesign

Our proposal for $25,000...
```

**What happens:**
1. ✓ Finds ALL 3 vendors with email team@agency.com
2. ✓ Matches RFP by subject
3. ✓ **Saves 3 proposals** (one for each vendor!)
4. ✓ All can be compared together

### Different RFP (Specify RFP_ID)

```
Email From: vendor@company.com
Subject: Random Subject

RFP_ID: 7

Our proposal for $30,000...
```

**What happens:**
1. ✓ Finds vendor by email
2. ✓ Uses RFP ID 7 (ignores subject)
3. ✓ Saves proposal for that RFP

---

## 🔧 Method 2: Manual Processing

### Option A: Single Vendor

```powershell
curl -X POST http://localhost:4000/api/webhooks/manual-response `
  -H "Content-Type: application/json" `
  -d @- <<EOF
{
  "vendorId": 1,
  "rfpId": 5,
  "emailBody": "We propose $45,000 total. Timeline: 30 days. Terms: Net 30."
}
EOF
```

### Option B: Multiple Vendors with Same Email

```powershell
curl -X POST http://localhost:4000/api/webhooks/manual-response `
  -H "Content-Type: application/json" `
  -d @- <<EOF
{
  "vendorEmail": "team@agency.com",
  "rfpId": 5,
  "emailBody": "We propose $25,000 total. Timeline: 15 days. Terms: Net 15."
}
EOF
```

**Result:** Proposal saved for ALL 3 vendors with email team@agency.com

---

## 📊 Use Cases

### Case 1: Same Email, Multiple Vendors
**Scenario:** Marketing agency has 3 team members, all use company email

```
Vendor 1: Alice <team@agency.com>
Vendor 2: Bob <team@agency.com>
Vendor 3: Charlie <team@agency.com>
```

**Send proposal from team@agency.com**
```
RFP_ID: 5

We bid $25,000 for this project.
```

**Result:** All 3 vendors get the same proposal → can compare together

### Case 2: One Vendor, Multiple RFPs
**Scenario:** Vendor sends proposals for 2 different RFPs from same email

```
Email 1:
Subject: RE: RFP - Website Design

Proposal for website...
```

**Result:** Proposal 1 saved for RFP (matched by subject)

```
Email 2:
RFP_ID: 8

Proposal for mobile app...
```

**Result:** Proposal 2 saved for RFP 8

**Outcome:** Same vendor has proposals for 2 RFPs ✓

### Case 3: Multiple Vendors, Multiple RFPs

```
RFP 1: Cloud Migration
  Vendor A: $50,000
  Vendor B: $45,000
  Team@agency.com (all 3 members): $40,000

RFP 2: Security Audit
  Vendor A: $15,000
  Team@agency.com (all 3 members): $12,000
```

All proposals compared separately per RFP ✓

---

## 🚀 Quick Test

### Test Multiple Vendors

```bash
cd backend

# Create 2 vendors with SAME email
# In frontend, go to Vendors:
# Vendor 1: Alice, email: shared@company.com
# Vendor 2: Bob, email: shared@company.com

# Run the test script
node process-email-response.js
```

Update the script to use same email, it will save proposal for both vendors!

---

## 🔐 Security Notes

**VENDOR_ID in email body:**
- Only works if that vendor has the sender email
- Prevents cross-vendor proposal injection
- Validates against database

**RFP_ID in email body:**
- Can specify any RFP_ID
- Useful for vendors responding weeks later
- Subject line takes precedence if RFP_ID not specified

---

## 📋 Request Format Reference

### Email Webhook (Auto)
```json
{
  "from": "vendor@company.com",
  "subject": "RE: RFP - Project Title",
  "text": "Proposal text here...",
  "html": "<html>Proposal HTML...</html>",
  "to": "reply@yourdomain.com"
}
```

### Manual Webhook - Single Vendor
```json
{
  "vendorId": 1,
  "rfpId": 5,
  "emailBody": "Proposal text..."
}
```

### Manual Webhook - Multiple Vendors
```json
{
  "vendorEmail": "team@company.com",
  "rfpId": 5,
  "emailBody": "Proposal text..."
}
```

---

## ✅ Testing Checklist

- [ ] Create vendor with shared email
- [ ] Create another vendor with same email
- [ ] Create RFP
- [ ] Run `node process-email-response.js`
- [ ] Check Compare Proposals - should see 2 proposals!
- [ ] Both proposals have same email source but different vendor IDs ✓

Done! 🎉
