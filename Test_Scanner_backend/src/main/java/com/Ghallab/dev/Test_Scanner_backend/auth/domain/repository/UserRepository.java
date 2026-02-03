package com.Ghallab.dev.Test_Scanner_backend.auth.domain.repository;

import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for User entity
 * Provides CRUD operations and custom queries for users
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);


    Optional<User> findById(UUID uuid);

    boolean existsByEmail(String email);
}

