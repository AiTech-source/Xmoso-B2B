ALTER TABLE products ADD COLUMN IF NOT EXISTS installation_media JSONB DEFAULT '[]';
