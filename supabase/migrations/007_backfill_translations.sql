-- 为已有产品自动生成缺失的翻译记录
-- 基于 model_number 自动生成 slug 和 name
-- 运行后管理后台即可看到所有产品

INSERT INTO product_translations (product_id, locale, slug, name, description)
SELECT
  p.id,
  'en',
  lower(p.model_number) || '-wine-cooler',
  p.model_number || ' Wine Cooler',
  ''
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM product_translations pt
  WHERE pt.product_id = p.id AND pt.locale = 'en'
);

INSERT INTO product_translations (product_id, locale, slug, name, description)
SELECT
  p.id,
  'zh',
  lower(p.model_number) || '-wine-cooler-cn',
  p.model_number || ' 恒温酒柜',
  ''
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM product_translations pt
  WHERE pt.product_id = p.id AND pt.locale = 'zh'
);
