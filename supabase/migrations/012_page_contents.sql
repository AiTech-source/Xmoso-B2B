-- Editable page content for About, Contact, etc.
CREATE TABLE IF NOT EXISTS page_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_key VARCHAR(50) NOT NULL, -- 'about', 'contact'
  locale VARCHAR(5) NOT NULL DEFAULT 'en',
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT DEFAULT '',
  content JSONB DEFAULT '{"blocks":[]}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_key, locale)
);

ALTER TABLE page_contents DISABLE ROW LEVEL SECURITY;

-- Insert default empty records
INSERT INTO page_contents (page_key, locale, title, content) VALUES
  ('about', 'en', 'About DeepCool', '{"blocks":[{"type":"heading","data":"Our Story","style":{"color":"#8BC8A0","fontSize":"28","fontWeight":"300","textAlign":"center"}},{"type":"text","data":"Founded in Germany, DeepCool combines precision engineering with environmental responsibility to create the finest wine cooling cabinets.","style":{"color":"#C0C0C0","fontSize":"16"}},{"type":"divider","data":"","style":{}}]}'),
  ('about', 'zh', '关于深拓', '{"blocks":[{"type":"heading","data":"我们的故事","style":{"color":"#8BC8A0","fontSize":"28","fontWeight":"300","textAlign":"center"}},{"type":"text","data":"深拓源于德国，将精密工程与环境责任融为一体，打造顶级葡萄酒恒温柜。","style":{"color":"#C0C0C0","fontSize":"16"}},{"type":"divider","data":"","style":{}}]}'),
  ('contact', 'en', 'Contact Us', '{"blocks":[]}'),
  ('contact', 'zh', '联系我们', '{"blocks":[]}')
ON CONFLICT (page_key, locale) DO NOTHING;
