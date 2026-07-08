-- Backfill empty highlights from product_specs (first 5 values)
UPDATE products p
SET highlights = sub.highlights
FROM (
  SELECT
    ps.product_id,
    jsonb_agg(ps.value ORDER BY ps.sort_order) AS highlights
  FROM (
    SELECT DISTINCT ON (ps.product_id, ps.sort_order)
      ps.product_id, ps.value, ps.sort_order
    FROM product_specs ps
    ORDER BY ps.product_id, ps.sort_order
  ) ps
  GROUP BY ps.product_id
) sub
WHERE p.id = sub.product_id
  AND (p.highlights IS NULL OR p.highlights = '[]'::jsonb OR jsonb_array_length(p.highlights) = 0);

-- If product_specs table is empty, try the old specifications JSONB
UPDATE products p
SET highlights = sub.highlights
FROM (
  SELECT
    p.id AS product_id,
    COALESCE(
      (SELECT jsonb_agg(value) FROM (
        SELECT specs->>'value' AS value
        FROM jsonb_array_elements(p.specifications->'specs') AS specs
        LIMIT 5
      ) sub),
      '[]'::jsonb
    ) AS highlights
  FROM products p
) sub
WHERE p.id = sub.product_id
  AND (p.highlights IS NULL OR p.highlights = '[]'::jsonb OR jsonb_array_length(p.highlights) = 0);
