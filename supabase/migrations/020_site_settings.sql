CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL DEFAULT ''
);

ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;

INSERT INTO site_settings (key, value) VALUES ('default_theme', 'dark')
ON CONFLICT (key) DO NOTHING;
