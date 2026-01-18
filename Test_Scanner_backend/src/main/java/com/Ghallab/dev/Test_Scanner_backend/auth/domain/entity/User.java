package com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity;

import com.Ghallab.dev.Test_Scanner_backend.shared.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * User entity representing application users
 * Can be ADMIN or USER (regular user)
 */
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class User extends BaseEntity {

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @NotBlank(message = "Password hash is required")
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    @Column(name = "phone_number")
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "roles", columnDefinition = "VARCHAR(50)[]" , nullable = false)
    private List<Role> roles;

    @NotBlank(message = "First name is required")
    @Size(max = 75, message = "First name must be at most 75 characters")
    @Pattern(regexp = "^[\\p{L} .'-]+$", message = "First name contains invalid characters")
    @Column(name = "first_name", nullable = false , length = 75)
    private String firstName;

    @Size(max = 75, message = "Middle name must be at most 75 characters")
    @Pattern(regexp = "^[\\p{L} .'-]*$", message = "Middle name contains invalid characters")
    @Column(name = "middle_name", length = 75)
    private String middleName;

    @NotBlank(message = "Last name is required")
    @Size(max = 75, message = "Last name must be at most 75 characters")
    @Pattern(regexp = "^[\\p{L} .'-]+$", message = "Last name contains invalid characters")
    @Column(name = "last_name", length = 75, nullable = false)
    private String lastName;

    @Column(name = "full_name", insertable = false, updatable = false)
    private String fullName;



    @Column(name = "last_login")
    private LocalDateTime lastLogin;


    private boolean active ;

    public enum Role {
        USER,
        ADMIN
    }
}

