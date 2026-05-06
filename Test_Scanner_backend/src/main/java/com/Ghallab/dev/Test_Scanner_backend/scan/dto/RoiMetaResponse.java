package com.Ghallab.dev.Test_Scanner_backend.scan.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoiMetaResponse {
    private String roiName;
    private Boolean empty;
    private Double inkRatio;
    private Integer numComponents;
    private Integer meaningfulComponents;
    private Integer totalArea;
    private Integer maxArea;
    private String sourceFile;
}
