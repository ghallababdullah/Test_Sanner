-- Quick Reference: Copy-paste commands for PSQL

-- ===================================================
-- GRADING_RESULTS INDEXES
-- ===================================================

-- High priority: User results with date sorting
CREATE INDEX IF NOT EXISTS idx_grading_results_user_created ON grading_results(user_id, created_at DESC);

-- High priority: Test results with percentage sorting
CREATE INDEX IF NOT EXISTS idx_grading_results_test_percentage ON grading_results(test_id, percentage DESC);

-- Medium priority: Grade statistics
CREATE INDEX IF NOT EXISTS idx_grading_results_grade_created ON grading_results(grade, created_at DESC);


-- ===================================================
-- GRADING_ANSWER_DETAILS INDEXES
-- ===================================================

-- CRITICAL: Find specific answer by result and question
CREATE INDEX IF NOT EXISTS idx_grading_answer_details_result_question ON grading_answer_details(grading_result_id, question_number);

-- CRITICAL: Find incorrect answers
CREATE INDEX IF NOT EXISTS idx_grading_answer_details_result_correct ON grading_answer_details(grading_result_id, is_correct);

-- Medium priority: Question difficulty analysis
CREATE INDEX IF NOT EXISTS idx_grading_answer_details_question_correct ON grading_answer_details(question_number, is_correct);

-- Low priority: OCR debugging
CREATE INDEX IF NOT EXISTS idx_grading_answer_details_distance ON grading_answer_details(distance);


-- ===================================================
-- VERIFY INDEXES WERE CREATED
-- ===================================================

-- Check grading_results indexes
\d grading_results

-- Check grading_answer_details indexes
\d grading_answer_details

-- Or query the system:
SELECT indexname FROM pg_indexes
WHERE tablename IN ('grading_results', 'grading_answer_details')
ORDER BY tablename, indexname;

