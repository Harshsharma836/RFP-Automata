# Gmail Auto-Reading Setup Guide

## How It Works

Instead of manually pasting emails, the system **automatically polls your Gmail inbox** every 60 seconds for new unread emails from vendors. When found, it:

1. Fetches email content
2. Sends to webhook for parsing
3. AI scores the proposal
4. Saves to database
5. Marks email as read
6. Proposal appears in Compare view

## Setup Steps

### 1. Create Gmail OAuth2 Credentials

Go to: https://console.cloud.google.com/apis/credentials

**Steps:**

### 2. Install Google API Library

```bash
cd backend
npm install googleapis
```

### 3. Start Gmail Integration

```bash
cd backend
node gmail-integration.js
```

**First run only:**

# Gmail Integration Removed


 # Gmail Integration Removed

 This file has been removed and replaced with this single-line note.
 The Gmail auto-read integration is no longer part of the project.
