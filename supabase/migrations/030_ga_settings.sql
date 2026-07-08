INSERT INTO site_settings (key, value) VALUES ('ga_id', '')
ON CONFLICT (key) DO NOTHING;
