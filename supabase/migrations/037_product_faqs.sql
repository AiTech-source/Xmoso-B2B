-- FAQ for product pages (B2B buyer questions)
CREATE TABLE IF NOT EXISTS product_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_type TEXT DEFAULT '' NOT NULL,       -- empty/null = generic, e.g. "Wine Coolers", "Cigar Cabinets"
  locale VARCHAR(5) DEFAULT 'en' NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow querying by product_type + locale
CREATE INDEX IF NOT EXISTS idx_product_faqs_type_locale ON product_faqs(product_type, locale, sort_order);
