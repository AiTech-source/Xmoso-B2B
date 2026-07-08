-- Add per-locale rich content to product_translations
ALTER TABLE product_translations ADD COLUMN IF NOT EXISTS content JSONB DEFAULT NULL;
