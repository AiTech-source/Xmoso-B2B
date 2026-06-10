CREATE TABLE IF NOT EXISTS faq_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  locale VARCHAR(5) NOT NULL DEFAULT 'en',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'General',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE faq_items DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_faq_locale_category ON faq_items(locale, category, sort_order);
