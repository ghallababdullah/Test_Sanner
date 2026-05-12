package com.Ghallab.dev.Test_Scanner_backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class RegistrationRequest {
    @NotBlank(message = "FirstName is Required")
    private String firstName ;

    private String middleName ;


    private String lastName ;

    private String phoneNumber ;

    @NotBlank(message = "Email is required")
    @Email(message = "Введите корректный email")
    @Size(max = 254, message = "Email слишком длинный")
    @Pattern(
            regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
            message = "Введите реальный email в формате name@example.com"
    )
    private String email ;

    private List<String> roles ;

    @NotBlank(message = "Password is required")
    private String password ;

}
