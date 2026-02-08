-- Migration to remove unnecessary fields from scan_sessions table
-- This removes processed_blanks and failed_blanks which are not used

ALTER TABLE scan_sessions DROP COLUMN IF EXISTS processed_blanks;
ALTER TABLE scan_sessions DROP COLUMN IF EXISTS failed_blanks;
ALTER TABLE scan_sessions DROP COLUMN IF EXISTS completed_at;
ALTER TABLE scan_sessions DROP COLUMN IF EXISTS processing_time_ms;
ALTER TABLE scan_sessions DROP COLUMN IF EXISTS status;

-- These fields are not needed because:
-- 1. We don't track processing status at session level
-- 2. We don't track failed blanks (they just have low confidence)
-- 3. Grading is separate from scanning
-- 4. Session stays open indefinitely (no "completion" needed)

