package com.Ghallab.dev.Test_Scanner_backend.scan.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoiOverridesRequest {
    private Map<String, RoiBoxResponse> overrides;
}
