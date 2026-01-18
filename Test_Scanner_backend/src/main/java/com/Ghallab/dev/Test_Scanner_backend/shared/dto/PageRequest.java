package com.Ghallab.dev.Test_Scanner_backend.shared.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageRequest {

    private Integer page = 0;

    private Integer size = 20;

    private String sort;
}

