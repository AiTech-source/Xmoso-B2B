INSERT INTO site_settings (key, value) VALUES
  ('og_brand_name', 'DeepCool'),
  ('og_site_url', 'deepcool.com')
ON CONFLICT (key) DO NOTHING;
