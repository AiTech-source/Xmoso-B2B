-- ============================================================
-- AI SEO Content Pipeline — Schema
-- pgvector extension + technical_knowledge (RAG) + seo_articles
-- ============================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. Technical Knowledge Base (企业核心技术干货，用于 RAG 检索)
CREATE TABLE IF NOT EXISTS technical_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100) NOT NULL,              -- 分类：尺寸/风道/材质/结构/制冷/节能
  title TEXT NOT NULL,                         -- 技术点标题
  content TEXT NOT NULL,                       -- 技术干货正文（可 Markdown）
  embedding VECTOR(1536),                      -- Gemini embedding 向量
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 向量索引：IVFFlat 加速余弦相似度搜索
CREATE INDEX IF NOT EXISTS idx_technical_knowledge_embedding
  ON technical_knowledge
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 按分类检索加速
CREATE INDEX IF NOT EXISTS idx_technical_knowledge_category
  ON technical_knowledge (category);

-- 3. SEO 生成文章表
CREATE TABLE IF NOT EXISTS seo_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,                   -- URL 友好标识
  title TEXT NOT NULL,                         -- SEO 标题
  meta_description TEXT DEFAULT '',             -- 搜索引擎描述
  content_markdown TEXT NOT NULL,               -- AI 生成的 Markdown 正文
  keyword TEXT DEFAULT '',                      -- 生成时使用的关键词
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_articles_slug ON seo_articles (slug);
CREATE INDEX IF NOT EXISTS idx_seo_articles_status ON seo_articles (status);

-- 4. RLS 策略
ALTER TABLE technical_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_articles ENABLE ROW LEVEL SECURITY;

-- technical_knowledge: 服务端可读（仅 service_role），公开无需查询
CREATE POLICY "technical_knowledge_anon_select"
  ON technical_knowledge FOR SELECT USING (true);

-- seo_articles: 已发布的公开可读
CREATE POLICY "seo_articles_published_select"
  ON seo_articles FOR SELECT
  USING (status = 'published');

-- 允许 service_role 写入
CREATE POLICY "seo_articles_service_insert"
  ON seo_articles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "seo_articles_service_update"
  ON seo_articles FOR UPDATE
  USING (true);

-- 5. 余弦相似度匹配函数（RAG 核心）
CREATE OR REPLACE FUNCTION match_technical_knowledge(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  title TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tk.id,
    tk.category::TEXT,
    tk.title::TEXT,
    tk.content::TEXT,
    1 - (tk.embedding <=> query_embedding) AS similarity
  FROM technical_knowledge tk
  WHERE 1 - (tk.embedding <=> query_embedding) > match_threshold
  ORDER BY tk.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
