# AI-Powered RFP Management (Minimal Prototype)

This repository is a minimal single-user prototype for an AI-powered RFP management system. It demonstrates an end-to-end flow:

- Create an RFP from natural language
- Manage vendors and send RFPs via SendGrid
- Parse vendor responses (text) into structured proposals using a simple AI/heuristic service
- Compare proposals and return a scored recommendation

Structure
- `backend/` — Express API, Postgres integration, SendGrid email sending, simple AI service (groq-sdk placeholder)
- `frontend/` — React app (no TypeScript) with UI to create RFPs, manage vendors, send RFPs, and view proposal comparisons

Quick Setup

1. Create a Postgres database and run `backend/init.sql` to create tables, or run the SQL manually.
2. Copy `.env.example` to `.env` and fill the values (DATABASE_URL, SENDGRID_API_KEY, FROM_EMAIL, optional GROQ_API_KEY/OPENAI_API_KEY).
3. Install backend dependencies and start server:

```powershell
cd backend
npm install
npm run dev
```

4. Install frontend and run dev server:

```powershell
cd frontend
npm install
npm run dev
```

Environment variables (.env)
- `DATABASE_URL` — Postgres connection string
- `SENDGRID_API_KEY` — SendGrid API key for sending RFP emails
- `FROM_EMAIL` — Sender email used for outgoing RFPs
- `GROQ_API_KEY` — Optional: API key for Groq SDK integration (prototype placeholder)
- `OPENAI_API_KEY` — Optional fallback if you want to integrate OpenAI instead
- `PORT` — Backend port (defaults to 4000)

API Endpoints (main)

- POST `/api/rfps/parse`
  - Body: `{ "text": "natural language description" }`
  - Response: `{ ok: true, rfp: { title, description, budget, delivery_days, items } }`

- POST `/api/rfps`
  - Body: structured RFP JSON (title, description, budget, delivery_days, items)
  - Response: `{ ok: true, rfp }`

- GET `/api/rfps`
  - Response: `{ ok: true, rfps: [...] }`

- POST `/api/vendors`
  - Body: `{ name, email, contact? }`
  - Response: `{ ok: true, vendor }`

- GET `/api/vendors`
  - Response: `{ ok: true, vendors: [...] }`

- POST `/api/send-rfp`
  - Body: `{ rfp_id, vendor_id }`
  - Sends an email (via SendGrid) with the RFP description to the vendor's email

- POST `/api/proposals/parse`
  - Body: `{ text: "vendor reply or proposal body" }`
  - Response: parsed proposal JSON (total, line_items, terms)

- POST `/api/proposals`
  - Body: `{ rfp_id, vendor_id, proposal }` — saves parsed proposal

- GET `/api/proposals/compare/:rfpId`
  - Response: `{ ok: true, compared: [ ...scored proposals...] }`

Design decisions & modeling

- RFP model (`rfps` table): `id, title, description, budget, delivery_days, items (jsonb)`
- Vendor model (`vendors`): `id, name, email, contact`
- Proposal model (`proposals`): `id, rfp_id, vendor_id, proposal_json`

Scoring & Comparison

- The prototype `compareProposals` uses a simple heuristic: presence of total and line items increases the score; lower total tends to improve score. This is intentionally simple to keep the prototype explainable. In a production system, scoring would be configurable and consider warranty, delivery, terms, compliance, and risk.

AI Integration

- The repo includes `backend/services/aiService.js` where integration points for `groq-sdk` or OpenAI can be added. For the assignment we provide a minimal heuristic parser for both RFP text and vendor proposals so the system can run without paid API keys.

Assumptions & limitations

- Incoming vendor responses are provided as plain text (email body). Parsing attachments (PDFs, spreadsheets) is out-of-scope for the prototype.
- No authentication — single-user prototype.
- The AI integration is a prototype hook. If you add valid `GROQ_API_KEY` or `OPENAI_API_KEY` you should replace the heuristic parsing with LLM calls.

What to run for a quick demo

1. Start Postgres and set `DATABASE_URL`.
2. Start backend (see commands above).
3. Start frontend and open the Vite URL (usually `http://localhost:5173`).
4. Create vendors, create an RFP using natural language, save it.
5. Use "Send RFP" to email vendors (requires SendGrid configured).
6. Simulate receiving a vendor response by hitting `/api/proposals/parse` with sample proposal text, then POST `/api/proposals` to save it. Then use `/api/proposals/compare/:rfpId` or the frontend Compare view.

AI Tools used while building

- Development used ChatGPT (assistant) to design the folder structure and helper code; the prototype uses a heuristic parser in `aiService` and placeholder comments where Groq/OpenAI integrations would go.

Next steps / improvements

- Integrate a real LLM via `groq-sdk` or OpenAI with carefully designed prompts for robust parsing.
- Add email receiving via IMAP/webhooks to automate ingesting vendor replies.
- Add attachments parsing (PDF / XLSX) using OCR and table extraction.
- Improve scoring by configurable weights and factors.
