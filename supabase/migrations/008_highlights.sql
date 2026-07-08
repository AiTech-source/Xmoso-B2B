-- Add highlights column for product card snippets
ALTER TABLE products ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]';

-- Backfill existing products: use first 5 spec values as highlights
UPDATE products SET highlights = (
  SELECT COALESCE(
    (SELECT jsonb_agg(value) FROM (
      SELECT specs->>'value' AS value FROM jsonb_array_elements(specifications->'specs') AS specs
      LIMIT 5
    ) sub),
    '[]'::jsonb
  )
);
