-- Minimal schema for RFP prototype
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact TEXT,
  category TEXT DEFAULT 'general',
  rating INT DEFAULT 5,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rfps (
  id SERIAL PRIMARY KEY,
  title TEXT,
  description TEXT,
  budget NUMERIC,
  delivery_days INT,
  priority TEXT DEFAULT 'medium',
  category TEXT DEFAULT 'general',
  items JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY,
  rfp_id INT REFERENCES rfps(id) ON DELETE CASCADE,
  vendor_id INT REFERENCES vendors(id) ON DELETE SET NULL,
  proposal_json JSONB,
  total NUMERIC,
  line_items JSONB,
  terms TEXT,
  ai_score NUMERIC DEFAULT 0,
  ai_feedback TEXT,
  raw_text TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_sends (
  id SERIAL PRIMARY KEY,
  rfp_id INT REFERENCES rfps(id) ON DELETE CASCADE,
  vendor_id INT REFERENCES vendors(id) ON DELETE SET NULL,
  sent_at TIMESTAMP DEFAULT now(),
  status TEXT DEFAULT 'sent'
);

CREATE INDEX IF NOT EXISTS idx_proposals_rfp ON proposals(rfp_id);
CREATE INDEX IF NOT EXISTS idx_proposals_vendor ON proposals(vendor_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_rfp ON email_sends(rfp_id);
