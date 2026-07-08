-- Add capabilities JSONB column for sourcing page (6 capability cards)
ALTER TABLE page_contents ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '[]'::jsonb;
