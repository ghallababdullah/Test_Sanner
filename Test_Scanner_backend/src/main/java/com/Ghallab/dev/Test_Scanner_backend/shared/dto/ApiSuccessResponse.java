package com.Ghallab.dev.Test_Scanner_backend.shared.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiSuccessResponse<T> {

    private LocalDateTime timestamp;

    private Integer status;

    private String message;

    private T data;
}

