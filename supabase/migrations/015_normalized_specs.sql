-- =============================================
-- New normalized spec system
-- =============================================

-- 1) Template: defines which spec labels belong to each product_type, in order
CREATE TABLE IF NOT EXISTS product_spec_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_type VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  UNIQUE(product_type, label)
);

ALTER TABLE product_spec_templates DISABLE ROW LEVEL SECURITY;

-- 2) Values: one row per spec per product
CREATE TABLE IF NOT EXISTS product_specs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  bg_color VARCHAR(50) DEFAULT '',
  font_size VARCHAR(10) DEFAULT '',
  color VARCHAR(50) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_specs DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_product_specs_product ON product_specs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_specs_filter ON product_specs(label, value);

-- 3) Migrate existing JSONB specs into the new table
INSERT INTO product_specs (product_id, label, value, sort_order, bg_color, font_size, color)
SELECT
  p.id AS product_id,
  (specs->>'label') AS label,
  (specs->>'value') AS value,
  COALESCE((specs->>'no')::int, 0) AS sort_order,
  (specs->>'bgColor') AS bg_color,
  (specs->>'fontSize') AS font_size,
  (specs->>'color') AS color
FROM products p,
LATERAL jsonb_array_elements(p.specifications->'specs') AS specs
WHERE p.specifications->'specs' IS NOT NULL
  AND jsonb_array_length(p.specifications->'specs') > 0
ON CONFLICT DO NOTHING;

-- 4) Seed default spec templates based on existing data
INSERT INTO product_spec_templates (product_type, label, sort_order)
SELECT DISTINCT pc.product_type, ps.label, ps.sort_order
FROM product_specs ps
JOIN products p ON p.id = ps.product_id
JOIN product_categories pc ON pc.id = p.category_id
ON CONFLICT (product_type, label) DO NOTHING;

-- 5) Migrate highlights into product_specs too (for the new import flow)
ALTER TABLE products ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]';
