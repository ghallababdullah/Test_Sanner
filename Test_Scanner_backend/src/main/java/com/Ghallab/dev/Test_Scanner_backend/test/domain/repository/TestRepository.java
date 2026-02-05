package com.Ghallab.dev.Test_Scanner_backend.test.domain.repository;

import com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Test entity
 */
@Repository
public interface TestRepository extends JpaRepository<Test, UUID> {
    List<Test> findByCreatorId(UUID creatorId);

    @Override
    Optional<Test> findById(UUID uuid);


    List<Test> findByIsActiveTrue();
}

