-- Template: attach uploaded PDF material files to products.
-- 1. Upload the original PDF through POST /api/upload with form field `file`.
-- 2. Copy the returned `/uploads/materials/<file>.pdf` URL into the JSON below.
-- 3. Replace the product selector with a precise product id or product name condition.

UPDATE products
SET sourceLinks = JSON_ARRAY(
  JSON_OBJECT(
    'title', '3M 产品资料 PDF',
    'url', '/uploads/materials/REPLACE_WITH_3M_PDF.pdf',
    'note', '原始产品资料'
  )
)
WHERE name LIKE '%3M%';

UPDATE products
SET sourceLinks = JSON_ARRAY(
  JSON_OBJECT(
    'title', '霍尼韦尔产品资料 PDF',
    'url', '/uploads/materials/REPLACE_WITH_HONEYWELL_PDF.pdf',
    'note', '原始产品资料'
  )
)
WHERE name LIKE '%霍尼韦尔%' OR name LIKE '%Honeywell%';

UPDATE products
SET sourceLinks = JSON_ARRAY(
  JSON_OBJECT(
    'title', 'MSA 产品资料 PDF',
    'url', '/uploads/materials/REPLACE_WITH_MSA_PDF.pdf',
    'note', '原始产品资料'
  )
)
WHERE name LIKE '%MSA%';
