package com.Ghallab.dev.Test_Scanner_backend.test.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTestRequest {

    private String title;

    private String subject;

    private String description;

    private Boolean isActive;
}

