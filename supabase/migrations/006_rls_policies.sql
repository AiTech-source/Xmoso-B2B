-- ⚠️ 全表禁用 RLS（开发阶段使用）
-- 在 Supabase SQL Editor 中运行这段 SQL

-- ========== 禁用所有业务表的 RLS ==========
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'products',
      'product_translations',
      'product_categories',
      'category_nav',
      'faq_translations',
      'inquiries',
      'page_views'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;

-- ========== 确保 Storage buckets 存在 ==========
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true),
       ('bulk', 'bulk', false)
ON CONFLICT (id) DO NOTHING;

-- ========== Storage 策略（允许 anon 上传/读取产品图片） ==========
DROP POLICY IF EXISTS "anon_products_insert" ON storage.objects;
DROP POLICY IF EXISTS "anon_products_select" ON storage.objects;

CREATE POLICY "anon_products_insert"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'products');

CREATE POLICY "anon_products_select"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'products');

-- ✅ 完成！刷新页面即可看到所有数据
