package com.Ghallab.dev.Test_Scanner_backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {

    @Email(message = "Email should be valid")
    private String email;

    @Size(min = 2, max = 75, message = "First name must be between 2 and 75 characters")
    private String firstName;

    @Size(max = 75, message = "Middle name must be at most 75 characters")
    private String middleName;

    @Size(min = 2, max = 75, message = "Last name must be between 2 and 75 characters")
    private String lastName;

    private String phoneNumber;
}
