CREATE TABLE IF NOT EXISTS language_settings (
  locale VARCHAR(10) PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE language_settings DISABLE ROW LEVEL SECURITY;

-- Seed all 7 locales — default enabled for EN, others disabled
INSERT INTO language_settings (locale, enabled) VALUES
  ('en', true),
  ('zh', false),
  ('fr', false),
  ('de', false),
  ('no', false),
  ('fi', false),
  ('sv', false)
ON CONFLICT (locale) DO NOTHING;
