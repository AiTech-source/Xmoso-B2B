INSERT INTO site_settings (key, value) VALUES
  ('favicon_url', '/favicon.svg'),
  ('site_title', 'DeepCool')
ON CONFLICT (key) DO NOTHING;
