-- Attach original brand catalog PDFs to products under Industrial Safety brand categories.
-- Safe to run more than once after the PDFs are present in server/uploads/materials.

SET @industrial_safety_id := (
  SELECT id FROM categories
  WHERE name = '工业安全' AND parentId IS NULL
  ORDER BY id
  LIMIT 1
);

SET @category_3m_id := (
  SELECT id FROM categories
  WHERE name = '3M' AND parentId = @industrial_safety_id
  ORDER BY id
  LIMIT 1
);

SET @category_honeywell_id := (
  SELECT id FROM categories
  WHERE name = '霍尼韦尔' AND parentId = @industrial_safety_id
  ORDER BY id
  LIMIT 1
);

SET @category_msa_id := (
  SELECT id FROM categories
  WHERE name = 'MSA' AND parentId = @industrial_safety_id
  ORDER BY id
  LIMIT 1
);

UPDATE products
SET sourceLinks = JSON_ARRAY(
  JSON_OBJECT(
    'title', '3M 个人安全防护产品目录 2025',
    'url', '/uploads/materials/3m-personal-safety-catalog-2025.pdf',
    'note', '原始产品资料'
  )
)
WHERE categoryId = @category_3m_id;

UPDATE products
SET sourceLinks = JSON_ARRAY(
  JSON_OBJECT(
    'title', '霍尼韦尔 PPE 综合样本',
    'url', '/uploads/materials/honeywell-ppe-catalog.pdf',
    'note', '原始产品资料'
  )
)
WHERE categoryId = @category_honeywell_id;

UPDATE products
SET sourceLinks = JSON_ARRAY(
  JSON_OBJECT(
    'title', 'MSA 梅思安综合样本 Rev2024 CN',
    'url', '/uploads/materials/msa-general-catalog-rev2024-cn.pdf',
    'note', '原始产品资料'
  )
)
WHERE categoryId = @category_msa_id;
