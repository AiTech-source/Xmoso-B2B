-- 1. 产品分类表
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  sort_order INT DEFAULT 0,
  hero_images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 为 products 表增加字段
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}';

-- 3. 改为 JSONB 存储图片（支持多图+排序+alt文本）
-- 保留现有 images 列但标记为迁移
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_gallery JSONB DEFAULT '[]';

-- 4. 分类导航表（用于首页导航菜单）
CREATE TABLE IF NOT EXISTS category_nav (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES product_categories(id),
  parent_id UUID REFERENCES category_nav(id),
  sort_order INT DEFAULT 0
);

-- 5. 插入默认分类
INSERT INTO product_categories (name, slug, sort_order) VALUES
  ('BI Series', 'bi-series', 1),
  ('BU Series', 'bu-series', 2),
  ('FS Series', 'fs-series', 3)
ON CONFLICT (slug) DO NOTHING;

-- 索引
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order);
