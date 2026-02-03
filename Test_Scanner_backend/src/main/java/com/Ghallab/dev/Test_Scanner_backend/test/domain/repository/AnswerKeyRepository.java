package com.Ghallab.dev.Test_Scanner_backend.test.domain.repository;

import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.AnswerKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for AnswerKey entity
 */
@Repository
public interface AnswerKeyRepository extends JpaRepository<AnswerKey, UUID> {
    List<AnswerKey> findByTestId(UUID testId);

    List<AnswerKey> findByTestIdOrderByQuestionNumber(UUID testId);

    Optional<AnswerKey> findByTestIdAndQuestionNumber(UUID testId, Integer questionNumber);
}

