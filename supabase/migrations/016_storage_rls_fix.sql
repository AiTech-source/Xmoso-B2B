-- =============================================
-- Fix Storage RLS - run this in Supabase SQL Editor
-- =============================================

-- 1. Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create/update policies for the anon role
-- These allow reading and writing files in the 'products' bucket
DROP POLICY IF EXISTS "anon_products_insert" ON storage.objects;
DROP POLICY IF EXISTS "anon_products_select" ON storage.objects;
DROP POLICY IF EXISTS "anon_products_upsert" ON storage.objects;
DROP POLICY IF EXISTS "anon_products_delete" ON storage.objects;

-- Allow public SELECT on all files in products bucket
CREATE POLICY "anon_products_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Allow INSERT for anon key to products bucket
CREATE POLICY "anon_products_insert"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'products');

-- Allow UPDATE/UPSERT for anon key to products bucket
CREATE POLICY "anon_products_upsert"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'products')
WITH CHECK (bucket_id = 'products');
