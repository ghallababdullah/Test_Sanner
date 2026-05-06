package com.Ghallab.dev.Test_Scanner_backend.scan.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoiBoxResponse {
    private Integer x1;
    private Integer y1;
    private Integer x2;
    private Integer y2;
}
