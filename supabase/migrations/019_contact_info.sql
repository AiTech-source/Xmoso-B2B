ALTER TABLE page_contents ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '[]';
