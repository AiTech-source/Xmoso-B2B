-- 创建 Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('bulk', 'bulk', false)
ON CONFLICT (id) DO NOTHING;

-- 允许匿名上传到 products bucket
CREATE POLICY "anon_products_insert"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'products');

CREATE POLICY "anon_products_select"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'products');

CREATE POLICY "anon_bulk_insert"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'bulk');
