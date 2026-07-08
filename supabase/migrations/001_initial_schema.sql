-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_number VARCHAR(255) UNIQUE NOT NULL,
  images TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  energy_rating VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  technical_specs JSONB DEFAULT '{}',
  meta_title TEXT DEFAULT '',
  meta_description TEXT DEFAULT '',
  og_image TEXT DEFAULT '',
  UNIQUE(locale, slug)
);

CREATE TABLE faq_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255) DEFAULT '',
  phone VARCHAR(100) DEFAULT '',
  message TEXT DEFAULT '',
  locale VARCHAR(5) DEFAULT 'en',
  page_url TEXT DEFAULT '',
  utm_source VARCHAR(255) DEFAULT '',
  utm_medium VARCHAR(255) DEFAULT '',
  utm_campaign VARCHAR(255) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  locale VARCHAR(5) DEFAULT 'en',
  path TEXT NOT NULL,
  country VARCHAR(2) DEFAULT '',
  user_agent TEXT DEFAULT '',
  referrer TEXT DEFAULT '',
  utm_source VARCHAR(255) DEFAULT '',
  utm_medium VARCHAR(255) DEFAULT '',
  utm_campaign VARCHAR(255) DEFAULT '',
  session_id VARCHAR(255) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_translations_locale_slug ON product_translations(locale, slug);
CREATE INDEX idx_product_translations_product_locale ON product_translations(product_id, locale);
CREATE INDEX idx_inquiries_created_at ON inquiries(created_at);
CREATE INDEX idx_inquiries_locale ON inquiries(locale);
CREATE INDEX idx_page_views_created_at ON page_views(created_at);
CREATE INDEX idx_page_views_country ON page_views(country);
CREATE INDEX idx_page_views_locale ON page_views(locale);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
