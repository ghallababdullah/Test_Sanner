package com.Ghallab.dev.Test_Scanner_backend.scan.domain.event;

import com.Ghallab.dev.Test_Scanner_backend.shared.event.DomainEvent;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class OcrResultEvent extends DomainEvent {
    private UUID blankId;
    private UUID scanSessionId;
    private UUID testId;
    private String status;
    private String studentName;
    private String studentClass;
    private String testDate;
    private Map<String, String> answers;
    private Map<String, String> errorCorrections;
    private Double overallConfidence;
    private Boolean manualReviewRequired;
    private List<String> manualReviewFields;
    private String processedImagePath;
    private String processingError;
}
