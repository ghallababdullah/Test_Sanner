package com.Ghallab.dev.Test_Scanner_backend.result.domain.repository;

import com.Ghallab.dev.Test_Scanner_backend.result.domain.entity.StudentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for StudentAnswer entity
 */
@Repository
public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, UUID> {
    List<StudentAnswer> findByScannedBlankId(UUID scannedBlankId);

    List<StudentAnswer> findByScannedBlankTestId(UUID testId);

    List<StudentAnswer> findByScannedBlankTestIdIn(List<UUID> testIds);

    void deleteByScannedBlankId(UUID scannedBlankId);
}

