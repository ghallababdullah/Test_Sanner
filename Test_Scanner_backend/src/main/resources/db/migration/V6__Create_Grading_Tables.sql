-- ===================================================
-- GRADING PACKAGE TABLES
-- ===================================================
-- These tables are INDEPENDENT from Result Package
-- Used for MANUAL grading without scanning
-- ===================================================

-- 1. GRADING_RESULTS
-- Main table for storing grading results
CREATE TABLE IF NOT EXISTS grading_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Student information extracted from the blank/paper
    student_name VARCHAR(200) NOT NULL,
    student_last_name VARCHAR(200),
    student_class VARCHAR(50),

    raw_score DECIMAL(8,2) NOT NULL DEFAULT 0,
    max_score DECIMAL(8,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    grade VARCHAR(2),

    feedback TEXT,
    version BIGINT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for grading_results
CREATE INDEX IF NOT EXISTS idx_grading_results_test_id ON grading_results(test_id);
CREATE INDEX IF NOT EXISTS idx_grading_results_user_id ON grading_results(user_id);
CREATE INDEX IF NOT EXISTS idx_grading_results_created ON grading_results(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_grading_results_test_user ON grading_results(test_id, user_id);


-- 2. GRADING_ANSWER_DETAILS
-- Details of each answer in a grading result
CREATE TABLE IF NOT EXISTS grading_answer_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grading_result_id UUID NOT NULL REFERENCES grading_results(id) ON DELETE CASCADE,

    question_number INT NOT NULL CHECK (question_number > 0 AND question_number <= 32),
    student_answer VARCHAR(500) NOT NULL,
    correct_answer VARCHAR(500) NOT NULL,

    points_earned DECIMAL(5,2) NOT NULL DEFAULT 0,
    max_points DECIMAL(5,2) NOT NULL,
    distance INT DEFAULT 0,
    is_correct BOOLEAN DEFAULT false,
    match_type VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for grading_answer_details
CREATE INDEX IF NOT EXISTS idx_grading_answer_details_result_id ON grading_answer_details(grading_result_id);
CREATE INDEX IF NOT EXISTS idx_grading_answer_details_question ON grading_answer_details(question_number);
CREATE INDEX IF NOT EXISTS idx_grading_answer_details_is_correct ON grading_answer_details(is_correct);
CREATE INDEX IF NOT EXISTS idx_grading_answer_details_created ON grading_answer_details(created_at DESC);

