-- Create Industrial Safety as a parent category and isolate 3M, Honeywell, and MSA as child brand categories.
-- Safe to run more than once.

SET @schema_name := DATABASE();
SET @add_parent_id_sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE categories ADD COLUMN parentId int NULL',
    'SELECT ''categories.parentId already exists'''
  )
  FROM information_schema.columns
  WHERE table_schema = @schema_name
    AND table_name = 'categories'
    AND column_name = 'parentId'
);
PREPARE add_parent_id_stmt FROM @add_parent_id_sql;
EXECUTE add_parent_id_stmt;
DEALLOCATE PREPARE add_parent_id_stmt;

INSERT INTO categories (name, icon, sort, isActive, parentId, createdAt, updatedAt)
SELECT '工业安全', '', 130, true, NULL, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = '工业安全' AND parentId IS NULL
);

SET @industrial_safety_id := (
  SELECT id FROM categories WHERE name = '工业安全' AND parentId IS NULL ORDER BY id LIMIT 1
);

INSERT INTO categories (name, icon, sort, isActive, parentId, createdAt, updatedAt)
SELECT '3M', '', 131, true, @industrial_safety_id, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = '3M' AND parentId = @industrial_safety_id
);

INSERT INTO categories (name, icon, sort, isActive, parentId, createdAt, updatedAt)
SELECT '霍尼韦尔', '', 132, true, @industrial_safety_id, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = '霍尼韦尔' AND parentId = @industrial_safety_id
);

INSERT INTO categories (name, icon, sort, isActive, parentId, createdAt, updatedAt)
SELECT 'MSA', '', 133, true, @industrial_safety_id, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = 'MSA' AND parentId = @industrial_safety_id
);

SET @category_3m_id := (
  SELECT id FROM categories WHERE name = '3M' AND parentId = @industrial_safety_id ORDER BY id LIMIT 1
);
SET @category_honeywell_id := (
  SELECT id FROM categories WHERE name = '霍尼韦尔' AND parentId = @industrial_safety_id ORDER BY id LIMIT 1
);
SET @category_msa_id := (
  SELECT id FROM categories WHERE name = 'MSA' AND parentId = @industrial_safety_id ORDER BY id LIMIT 1
);

UPDATE products
SET categoryId = @category_3m_id
WHERE name LIKE '%3M%'
   OR description LIKE '%3M%'
   OR tags LIKE '%3M%';

UPDATE products
SET categoryId = @category_honeywell_id
WHERE name LIKE '%霍尼韦尔%'
   OR name LIKE '%Honeywell%'
   OR description LIKE '%霍尼韦尔%'
   OR description LIKE '%Honeywell%'
   OR tags LIKE '%霍尼韦尔%'
   OR tags LIKE '%Honeywell%';

UPDATE products
SET categoryId = @category_msa_id
WHERE name LIKE '%MSA%'
   OR description LIKE '%MSA%'
   OR tags LIKE '%MSA%';
