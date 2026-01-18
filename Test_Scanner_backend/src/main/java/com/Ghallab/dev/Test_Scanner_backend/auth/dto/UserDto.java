package com.Ghallab.dev.Test_Scanner_backend.auth.dto;

import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public class UserDto {

    private String email;

    private String phoneNumber;

    private List<User.Role> roles;

    private String firstName;

    private String middleName;

    private String lastName;

    private String fullName;

}
