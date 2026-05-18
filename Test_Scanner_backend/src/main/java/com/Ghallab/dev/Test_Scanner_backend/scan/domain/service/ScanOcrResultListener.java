package com.Ghallab.dev.Test_Scanner_backend.scan.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.result.domain.service.ScannedBlankResultService;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity.ScannedBlank;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.event.OcrResultEvent;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.repository.ScannedBlankRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.client.Channel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScanOcrResultListener {

    private final ScannedBlankRepository scannedBlankRepository;
    private final ScannedBlankResultService scannedBlankResultService;
    private final ScanFileStorageService scanFileStorageService;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = "${app.scan.messaging.result-queue}")
    @Transactional
    public void handleOcrResult(OcrResultEvent event, Message message, Channel channel) throws IOException {
        long deliveryTag = message.getMessageProperties().getDeliveryTag();
        try {
            processEvent(event);
            channel.basicAck(deliveryTag, false);
        } catch (Exception exc) {
            log.error("Failed to process OCR result event for blank={}", event != null ? event.getBlankId() : null, exc);
            channel.basicNack(deliveryTag, false, true);
        }
    }

    private void processEvent(OcrResultEvent event) throws JsonProcessingException {
        if (event == null || event.getBlankId() == null) {
            log.warn("Received OCR result event without blankId, skipping");
            return;
        }

        UUID blankId = event.getBlankId();
        ScannedBlank blank = scannedBlankRepository.findById(blankId)
                .orElse(null);

        if (blank == null) {
            log.warn("Received OCR result for unknown blank: {}", blankId);
            return;
        }

        String status = event.getStatus();
        boolean shouldAutoScore = false;
        if ("PROCESSING".equalsIgnoreCase(status)) {
            applyProcessingResult(blank, event);
        } else if ("OCR_COMPLETED".equalsIgnoreCase(status)) {
            applyCompletedResult(blank, event);
            shouldAutoScore = true;
        } else {
            applyFailedResult(blank, event);
        }

        ScannedBlank savedBlank = scannedBlankRepository.save(blank);
        if (shouldAutoScore) {
            try {
                scannedBlankResultService.evaluateAndPersist(savedBlank);
            } catch (Exception exc) {
                log.warn("Auto-scoring failed for blank {}. Moving it to manual review.", savedBlank.getId(), exc);
                savedBlank.setNeedsReview(true);
                savedBlank.setReviewStatus(ScannedBlank.ReviewStatus.PENDING);
                savedBlank.setReviewNotes("Auto-scoring failed: " + exc.getMessage());
                scannedBlankRepository.save(savedBlank);
            }
        }
        log.info("Applied OCR result for blank={} status={}", blankId, savedBlank.getProcessingStatus());
    }

    private void applyCompletedResult(ScannedBlank blank, OcrResultEvent event) throws JsonProcessingException {
        var filteredAnswers = scannedBlankResultService.filterAnswersForTest(
                blank.getTest().getId(),
                event.getAnswers()
        );
        var filteredCorrections = scannedBlankResultService.filterAnswersForTest(
                blank.getTest().getId(),
                event.getErrorCorrections()
        );

        blank.setStudentName(event.getStudentName());
        blank.setStudentClass(event.getStudentClass());
        if (event.getTestDate() != null) {
            blank.setTestDate(event.getTestDate());
        }
        blank.setAnswers(objectMapper.writeValueAsString(defaultMap(filteredAnswers)));
        blank.setErrorCorrections(filteredCorrections == null || filteredCorrections.isEmpty()
                ? null
                : objectMapper.writeValueAsString(filteredCorrections));
        blank.setIsErrorCorrectionApplied(filteredCorrections != null && !filteredCorrections.isEmpty());
        blank.setProcessedImagePath(storeOcrArtifacts(blank, event.getProcessedImagePath()));
        blank.setProcessingError(null);
        blank.setProcessingStatus(ScannedBlank.ProcessingStatus.OCR_COMPLETED);
        blank.setProcessedAt(LocalDateTime.now());

        if (event.getOverallConfidence() != null) {
            blank.setOverallConfidence(BigDecimal.valueOf(event.getOverallConfidence()));
        } else {
            blank.setOverallConfidence(null);
        }

        boolean needsReview = requiresManualReview(blank, filteredAnswers, event);
        blank.setNeedsReview(needsReview);
        blank.setReviewStatus(needsReview
                ? ScannedBlank.ReviewStatus.PENDING
                : ScannedBlank.ReviewStatus.SKIPPED);
        if (needsReview && Boolean.TRUE.equals(event.getManualReviewRequired())
                && event.getManualReviewFields() != null && !event.getManualReviewFields().isEmpty()) {
            blank.setReviewNotes("Cascade review required for fields: " + String.join(", ", event.getManualReviewFields()));
        } else if (!needsReview) {
            blank.setReviewNotes(null);
        }
    }

    private void applyProcessingResult(ScannedBlank blank, OcrResultEvent event) {
        blank.setProcessingStatus(ScannedBlank.ProcessingStatus.PROCESSING);
        blank.setProcessingError(null);
        blank.setProcessedImagePath(event.getProcessedImagePath());
    }

    private void applyFailedResult(ScannedBlank blank, OcrResultEvent event) {
        blank.setProcessingStatus(ScannedBlank.ProcessingStatus.OCR_FAILED);
        blank.setProcessingError(event.getProcessingError());
        blank.setProcessedImagePath(storeOcrArtifacts(blank, event.getProcessedImagePath()));
        blank.setProcessedAt(LocalDateTime.now());
        blank.setOverallConfidence(null);
        blank.setNeedsReview(true);
        blank.setReviewStatus(ScannedBlank.ReviewStatus.PENDING);
        if (blank.getReviewNotes() == null || blank.getReviewNotes().isBlank()) {
            blank.setReviewNotes(event.getProcessingError());
        }
    }

    private Object defaultMap(Object value) {
        return value == null ? Collections.emptyMap() : value;
    }

    private String storeOcrArtifacts(ScannedBlank blank, String processedImagePath) {
        try {
            return scanFileStorageService.copyOcrArtifactsToStorage(blank.getOriginalImagePath(), processedImagePath);
        } catch (IOException exc) {
            log.warn("Failed to copy OCR artifacts for blank {} into storage", blank.getId(), exc);
            return processedImagePath;
        }
    }

    private boolean requiresManualReview(ScannedBlank blank, java.util.Map<String, String> filteredAnswers, OcrResultEvent event) {
        if (filteredAnswers == null || filteredAnswers.isEmpty()) {
            return true;
        }
        if (event != null && Boolean.TRUE.equals(event.getManualReviewRequired())) {
            return true;
        }
        if (blank.getStudentName() == null || blank.getStudentName().isBlank()) {
            return true;
        }
        if (blank.getStudentClass() == null || blank.getStudentClass().isBlank()) {
            return true;
        }
        if (blank.getTest() != null
                && blank.getTest().getClassLevel() != null
                && !blank.getTest().getClassLevel().equalsIgnoreCase(blank.getStudentClass())) {
            return true;
        }
        return blank.getOverallConfidence() == null || blank.getOverallConfidence().doubleValue() < 0.75d;
    }
}
