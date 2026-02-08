-- Migration to drop GIN indexes on TEXT fields
-- GIN indexes don't work with TEXT data type in PostgreSQL
-- Only JSON/JSONB types support GIN indexes

DROP INDEX IF EXISTS idx_scanned_blanks_answers_gin;
DROP INDEX IF EXISTS idx_scanned_blanks_final_answers_gin;
DROP INDEX IF EXISTS idx_scanned_blanks_error_corrections_gin;

-- Note: We're keeping regular indexes on TEXT fields that support full-text search
-- B-tree indexes work fine for TEXT columns

