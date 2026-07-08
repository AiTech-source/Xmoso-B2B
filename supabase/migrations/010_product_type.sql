-- Add product_type grouping to categories
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS product_type VARCHAR(100) NOT NULL DEFAULT 'Wine Coolers';

-- Update existing categories
UPDATE product_categories SET product_type = 'Wine Coolers' WHERE product_type = 'Wine Coolers';
