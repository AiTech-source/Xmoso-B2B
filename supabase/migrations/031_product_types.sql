CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_types DISABLE ROW LEVEL SECURITY;

INSERT INTO product_types (name, sort_order) VALUES
  ('Wine Coolers', 1),
  ('Cigar Cabinet', 2),
  ('Drinks Cooler', 3),
  ('Bar Cabinet With Cooler', 4),
  ('Other', 99)
ON CONFLICT (name) DO NOTHING;
