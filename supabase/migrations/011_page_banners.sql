-- Scene banners for each page
CREATE TABLE IF NOT EXISTS page_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_key VARCHAR(50) NOT NULL, -- 'home', 'products', 'product-detail', 'about', 'contact'
  image_url TEXT NOT NULL,
  link_url TEXT DEFAULT '',
  alt_text TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE page_banners DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_page_banners_page ON page_banners(page_key, sort_order);

-- Insert sample banners
INSERT INTO page_banners (page_key, image_url, alt_text, sort_order) VALUES
  ('home', '', 'Wine Cellar Ambience', 1),
  ('home', '', 'Modern Kitchen Setup', 2),
  ('home', '', 'Outdoor Patio Scene', 3),
  ('products', '', 'BI Series Showcase', 1),
  ('about', '', 'Factory Overview', 1),
  ('contact', '', 'Showroom Display', 1)
ON CONFLICT DO NOTHING;
