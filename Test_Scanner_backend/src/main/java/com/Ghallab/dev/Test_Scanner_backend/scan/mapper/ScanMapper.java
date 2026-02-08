package com.Ghallab.dev.Test_Scanner_backend.scan.mapper;

import com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity.ScannedBlank;
import com.Ghallab.dev.Test_Scanner_backend.scan.domain.entity.ScanSession;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.ScanSessionResponse;
import com.Ghallab.dev.Test_Scanner_backend.scan.dto.ScannedBlankResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ScanMapper - преобразует между Scan Entities и Response DTOs
 * Используется для преобразования данных сканирования для API
 */
@Component
public class ScanMapper {

    private final ModelMapper modelMapper;
    private final ObjectMapper objectMapper;

    public ScanMapper(ModelMapper modelMapper, ObjectMapper objectMapper) {
        this.modelMapper = modelMapper;
        this.objectMapper = objectMapper;
    }

    /**
     * Преобразует ScanSession Entity в ScanSessionResponse DTO
     * Используется при возврате сессии сканирования в API
     * Ручное маппинг: test → testId, user → userId, metadata JSON string → Object
     */
    public ScanSessionResponse toScanSessionResponse(ScanSession scanSession) {
        ScanSessionResponse response = modelMapper.map(scanSession, ScanSessionResponse.class);

        // ✅ Ручное маппинг для Test → TestId
        if (scanSession.getTest() != null) {
            response.setTestId(scanSession.getTest().getId());
        }

        // ✅ Ручное маппинг для User → UserId
        if (scanSession.getUser() != null) {
            response.setUserId(scanSession.getUser().getId());
        }

        // ✅ Ручное маппинг для metadata: JSON string → Object
        if (scanSession.getMetadata() != null && !scanSession.getMetadata().isEmpty()) {
            try {
                Object metadataObject = objectMapper.readValue(scanSession.getMetadata(), Object.class);
                response.setMetadata(metadataObject);
            } catch (Exception e) {
                // If parsing fails, keep as null
                response.setMetadata(null);
            }
        }

        return response;
    }

    /**
     * Преобразует ScannedBlank Entity в ScannedBlankResponse DTO
     * Используется при возврате отсканированного бланка в API
     * Ручное маппинг: scanSession → scanSessionId, test → testId
     * Ручное маппинг: JSON strings → Objects (десериализация)
     */
    public ScannedBlankResponse toScannedBlankResponse(ScannedBlank scannedBlank) {
        ScannedBlankResponse response = modelMapper.map(scannedBlank, ScannedBlankResponse.class);

        // ✅ Ручное маппинг для ScanSession → ScanSessionId
        if (scannedBlank.getScanSession() != null) {
            response.setScanSessionId(scannedBlank.getScanSession().getId());
        }

        // ✅ Ручное маппинг для Test → TestId
        if (scannedBlank.getTest() != null) {
            response.setTestId(scannedBlank.getTest().getId());
        }

        // ✅ Ручное маппинг для answers: JSON string → Object
        if (scannedBlank.getAnswers() != null && !scannedBlank.getAnswers().isEmpty()) {
            try {
                Object answersObject = objectMapper.readValue(scannedBlank.getAnswers(), Object.class);
                response.setAnswers(answersObject);
            } catch (Exception e) {
                response.setAnswers(null);
            }
        }

        // ✅ Ручное маппинг для errorCorrections: JSON string → Object
        if (scannedBlank.getErrorCorrections() != null && !scannedBlank.getErrorCorrections().isEmpty()) {
            try {
                Object correctionsObject = objectMapper.readValue(scannedBlank.getErrorCorrections(), Object.class);
                response.setErrorCorrections(correctionsObject);
            } catch (Exception e) {
                response.setErrorCorrections(null);
            }
        }

        return response;
    }

    /**
     * Преобразует список ScanSession в список ScanSessionResponse
     */
    public List<ScanSessionResponse> toScanSessionResponseList(List<ScanSession> scanSessions) {
        return scanSessions.stream()
                .map(this::toScanSessionResponse)
                .collect(Collectors.toList());
    }

    /**
     * Преобразует список ScannedBlank в список ScannedBlankResponse
     */
    public List<ScannedBlankResponse> toScannedBlankResponseList(List<ScannedBlank> scannedBlanks) {
        return scannedBlanks.stream()
                .map(this::toScannedBlankResponse)
                .collect(Collectors.toList());
    }
}

