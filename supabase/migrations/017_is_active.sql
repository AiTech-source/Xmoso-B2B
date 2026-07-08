-- Add is_active toggle for product publishing/unpublishing
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
UPDATE products SET is_active = true WHERE is_active IS NULL;
