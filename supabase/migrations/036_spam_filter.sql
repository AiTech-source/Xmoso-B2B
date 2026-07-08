-- Add spam flag to inquiries
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_inquiries_spam ON inquiries(is_spam, created_at DESC);
