# AI-Powered RFP Management (Minimal Prototype)

This repository is a minimal single-user prototype for an AI-powered RFP management system. It demonstrates an end-to-end flow:

- Create an RFP from natural language
 # RFP-Automata — Quick Start

 Simple, local prototype to create RFPs, send them to vendors, and collect/parse proposals.

 Getting started
 1. Create a Postgres database and run `backend/init.sql` to create tables.
 2. Copy `.env.example` → `.env` and set values (see Env section).

 Run backend
 ```powershell
 cd backend
 npm install
 npm run dev
 ```

 Run frontend
 ```powershell
 cd frontend
 npm install
 npm run dev
 ```

 Env variables
 - `DATABASE_URL` — Postgres connection string
 - `SENDGRID_API_KEY` — SendGrid key to send emails
 - `FROM_EMAIL` — sender email used for outgoing RFPs
 - `SENDGRID_WEBHOOK_KEY` — optional webhook verification key
 - `PORT` — backend port (default: 4000)

 Quick test (send + receive)
 - Use the app UI to create vendors and an RFP.
 - Use the Send RFP flow to email vendors (requires SendGrid configured).
 - To simulate an inbound email, run `node backend/test-webhook.js` (backend must be running).

 API notes (useful endpoints)
 - `POST /api/send-rfp` — send RFP to vendor(s)
 - `POST /api/webhooks/email` — webhook that accepts SendGrid inbound parse payloads
 - `POST /api/webhooks/manual-response` — paste vendor reply (vendorId or vendorEmail + rfpId + emailBody)
 - `POST /api/proposals` — save parsed proposal
 - `GET /api/proposals/compare/:rfpId` — get scored proposals for an RFP

 Design
 - Backend: Express + Postgres
 - Frontend: React (Vite)
 - AI parsing: `backend/services/aiService.js` has a heuristic parser and hooks for LLMs

 Support
 - If you want Gmail auto-read instead of SendGrid, I can re-add an optional module — but SendGrid inbound parse (or manual paste) is the maintained flow.

 That's it — open the frontend, create an RFP, send to vendors, and test proposals.
