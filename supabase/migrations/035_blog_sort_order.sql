-- Add sort_order to blog_posts for manual reordering
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_blog_posts_sort ON blog_posts(locale, sort_order, created_at DESC);
