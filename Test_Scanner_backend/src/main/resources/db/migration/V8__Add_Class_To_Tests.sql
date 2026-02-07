-- ===================================================
-- ADD CLASS COLUMN TO TESTS TABLE
-- ===================================================
-- Add class/grade level information to tests
-- This indicates which class/grade level the test is intended for

ALTER TABLE tests
ADD COLUMN IF NOT EXISTS class VARCHAR(50);

-- Create index on class for filtering/searching
CREATE INDEX IF NOT EXISTS idx_tests_class ON tests(class);

