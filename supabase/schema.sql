-- Edgecombe Enterprises Invoice Management Schema
-- Run this in your Supabase SQL editor to initialize the database

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT NOT NULL DEFAULT '',
  service_address TEXT NOT NULL DEFAULT '',
  line_items JSONB NOT NULL DEFAULT '[]',
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_terms TEXT NOT NULL DEFAULT 'Net 30',
  notes TEXT NOT NULL DEFAULT '',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'overdue', 'paid')),
  paid_at TIMESTAMPTZ,
  last_reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings table (single row)
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_address TEXT NOT NULL DEFAULT '',
  company_phone TEXT NOT NULL DEFAULT '',
  company_email TEXT NOT NULL DEFAULT '',
  default_payment_terms TEXT NOT NULL DEFAULT 'Net 30',
  twilio_account_sid TEXT NOT NULL DEFAULT '',
  twilio_auth_token TEXT NOT NULL DEFAULT '',
  twilio_whatsapp_number TEXT NOT NULL DEFAULT '',
  twilio_sms_number TEXT NOT NULL DEFAULT '',
  tax_rate NUMERIC(5,4) NOT NULL DEFAULT 0.08,
  tax_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoice number sequence (for EE-001, EE-002, etc.)
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert default settings row
INSERT INTO settings (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Index for common query patterns
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);
CREATE INDEX IF NOT EXISTS invoices_due_date_idx ON invoices(due_date);
CREATE INDEX IF NOT EXISTS invoices_created_at_idx ON invoices(created_at DESC);
