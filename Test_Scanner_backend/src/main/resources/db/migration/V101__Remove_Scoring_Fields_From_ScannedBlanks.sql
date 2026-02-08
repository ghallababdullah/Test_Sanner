-- Migration to remove scoring-related fields from scanned_blanks
-- These fields should NOT be in Scan module (that's Grading module's job)
-- Scan module only stores RAW data

ALTER TABLE scanned_blanks DROP COLUMN IF EXISTS is_scored;
ALTER TABLE scanned_blanks DROP COLUMN IF EXISTS raw_score;
ALTER TABLE scanned_blanks DROP COLUMN IF EXISTS max_score;
ALTER TABLE scanned_blanks DROP COLUMN IF EXISTS percentage;
ALTER TABLE scanned_blanks DROP COLUMN IF EXISTS grade;
ALTER TABLE scanned_blanks DROP COLUMN IF EXISTS feedback;
ALTER TABLE scanned_blanks DROP COLUMN IF EXISTS original_image_path;
ALTER TABLE scanned_blanks DROP COLUMN IF EXISTS processed_image_path;
ALTER TABLE scanned_blanks DROP COLUMN IF EXISTS thumbnail_path;
ALTER TABLE scanned_blanks DROP COLUMN IF EXISTS final_answers;
ALTER TABLE scanned_blanks DROP COLUMN IF EXISTS scored_at;

-- Keep only RAW DATA columns:
-- - answers (OCR extraction)
-- - error_corrections (student corrections)
-- - overall_confidence (OCR quality)
-- - needs_review, review_status (for manual review workflow)
-- - scanned_at, reviewed_at (timestamps)

