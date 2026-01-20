package com.Ghallab.dev.Test_Scanner_backend.auth.dto;

import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
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
public class UserDto {
    private UUID id;
    private String email;
    private String phoneNumber;
    private List<User.Role> roles;
    private String firstName;
    private String middleName;
    private String lastName;
    private String fullName;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
}
