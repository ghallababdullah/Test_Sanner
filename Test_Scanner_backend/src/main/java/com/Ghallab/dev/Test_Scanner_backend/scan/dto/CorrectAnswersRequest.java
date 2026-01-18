package com.Ghallab.dev.Test_Scanner_backend.scan.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CorrectAnswersRequest {

    @NotNull(message = "Error corrections are required")
    private JsonNode errorCorrections;

    private String reviewNotes;
}

