CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug VARCHAR(255) NOT NULL,
  excerpt TEXT DEFAULT '',
  content JSONB DEFAULT '{"blocks":[]}',
  author VARCHAR(100) DEFAULT '',
  cover_image TEXT DEFAULT '',
  locale VARCHAR(5) DEFAULT 'en',
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(locale, slug)
);

ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_blog_posts_locale_published ON blog_posts(locale, published, created_at DESC);
