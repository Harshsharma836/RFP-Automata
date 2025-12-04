-- Minimal schema for RFP prototype
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rfps (
  id SERIAL PRIMARY KEY,
  title TEXT,
  description TEXT,
  budget NUMERIC,
  delivery_days INT,
  items JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY,
  rfp_id INT REFERENCES rfps(id) ON DELETE CASCADE,
  vendor_id INT REFERENCES vendors(id) ON DELETE SET NULL,
  proposal_json JSONB,
  created_at TIMESTAMP DEFAULT now()
);
