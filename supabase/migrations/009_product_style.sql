-- Add product_style column for sub-type (Metal Type, Xmoso Type, etc.)
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_style VARCHAR(100) DEFAULT '';
