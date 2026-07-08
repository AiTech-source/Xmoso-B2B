-- Add default records for home/products/product-detail page toggles
INSERT INTO page_contents (page_key, locale, title, show_banner, vignette_enabled, content)
VALUES
  ('home', 'en', '', true, true, '{"blocks":[]}'),
  ('home', 'zh', '', true, true, '{"blocks":[]}'),
  ('products', 'en', '', true, true, '{"blocks":[]}'),
  ('products', 'zh', '', true, true, '{"blocks":[]}'),
  ('product-detail', 'en', '', true, true, '{"blocks":[]}'),
  ('product-detail', 'zh', '', true, true, '{"blocks":[]}')
ON CONFLICT (page_key, locale) DO NOTHING;
