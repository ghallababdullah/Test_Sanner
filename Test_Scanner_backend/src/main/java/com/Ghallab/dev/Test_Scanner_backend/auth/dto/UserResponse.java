package com.Ghallab.dev.Test_Scanner_backend.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String email;
    private String firstName;
    private String middleName;
    private String lastName;
    private String fullName;
    private String phoneNumber;
    private List<String> roles;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
}
