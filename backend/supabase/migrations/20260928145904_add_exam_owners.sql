-- 1. add column as nullable
ALTER TABLE exam_groups ADD COLUMN created_by TEXT;
ALTER TABLE exams ADD COLUMN created_by TEXT;

-- 2. handle existing rows by assign it with the user ID
UPDATE exam_groups SET created_by = 'usr_369p1bwinnz9' WHERE created_by IS NULL;
UPDATE exams SET created_by = 'usr_369p1bwinnz9' WHERE created_by IS NULL;

-- 3. enforce the not null constraint so future inserts never miss it
ALTER TABLE exam_groups ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE exams ALTER COLUMN created_by SET NOT NULL;