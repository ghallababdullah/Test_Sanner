package com.Ghallab.dev.Test_Scanner_backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
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
    @Email
    private String email ;

    private List<String> roles ;

    @NotBlank(message = "Password is required")
    private String password ;

}
