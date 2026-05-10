package com.Ghallab.dev.Test_Scanner_backend.site.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SiteContactRequest {

    @NotBlank(message = "Contact type is required")
    private String type;

    @NotBlank(message = "Name is required")
    @Size(max = 120, message = "Name is too long")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 160, message = "Email is too long")
    private String email;

    @Size(max = 160, message = "Organization is too long")
    private String organization;

    @NotBlank(message = "Subject is required")
    @Size(max = 180, message = "Subject is too long")
    private String subject;

    @NotBlank(message = "Message is required")
    @Size(max = 4000, message = "Message is too long")
    private String message;
}
