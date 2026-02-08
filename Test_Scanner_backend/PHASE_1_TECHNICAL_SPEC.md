# 📋 PHASE 1: Scan Processing Core — Детальная техническая спецификация

**Timeline:** Недели 1-3  
**Goal:** Готовые endpoints для React Native интеграции  
**Status:** Ready to implement

---

## 📁 Структура папок для новой фазы

```
src/main/java/com/Ghallab/dev/Test_Scanner_backend/

scan/                           ← NEW MODULE
├── controller/
│   └── ScanController.java
├── domain/
│   ├── entity/
│   │   ├── ScanSession.java    (уже есть в БД)
│   │   └── ScannedBlank.java   (уже есть в БД)
│   ├── service/
│   │   ├── ScanSessionService.java
│   │   ├── ScanSessionServiceImpl.java
│   │   ├── ScannedBlankService.java
│   │   └── ScannedBlankServiceImpl.java
│   └── repository/
│       ├── ScanSessionRepository.java
│       └── ScannedBlankRepository.java
└── dto/
    ├── request/
    │   ├── CreateScanSessionRequest.java
    │   ├── ProcessScanRequest.java
    │   └── UpdateBlankStatusRequest.java
    └── response/
        ├── ScanSessionResponse.java
        ├── ScannedBlankResponse.java
        └── ScanProcessingResponse.java
```

---

## 🗄️ DTOs (Data Transfer Objects)

### Request DTOs

#### CreateScanSessionRequest
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateScanSessionRequest {
    
    @NotNull(message = "Test ID is required")
    private UUID testId;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    @NotBlank(message = "Device ID is required")
    private String deviceId;
    
    @NotBlank(message = "Device model is required")
    private String deviceModel;
    
    // Optional metadata
    private Map<String, String> metadata;
}
```

#### ProcessScanRequest
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProcessScanRequest {
    
    @NotNull(message = "Scan session ID is required")
    private UUID scanSessionId;
    
    @NotNull(message = "Test ID is required")
    private UUID testId;
    
    @NotBlank(message = "Student name is required")
    private String studentName;
    
    @NotBlank(message = "Student class is required")
    private String studentClass;
    
    @NotNull(message = "Test date is required")
    private LocalDate testDate;
    
    @NotEmpty(message = "At least one answer is required")
    @Valid
    private List<ScannedAnswerDto> answers;
    
    @Valid
    private List<ErrorCorrectionDto> errorCorrections;
    
    @NotNull(message = "OCR metadata is required")
    @Valid
    private OcrMetadataDto ocrMetadata;
}
```

#### ScannedAnswerDto
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ScannedAnswerDto {
    
    @Min(value = 1, message = "Question number must be >= 1")
    @Max(value = 32, message = "Question number must be <= 32")
    private Integer questionNumber;
    
    @NotBlank(message = "Scanned answer cannot be blank")
    private String scannedAnswer;
    
    @DecimalMin(value = "0.0", message = "Confidence must be >= 0.0")
    @DecimalMax(value = "1.0", message = "Confidence must be <= 1.0")
    private BigDecimal confidence;
}
```

#### ErrorCorrectionDto
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorCorrectionDto {
    
    @Min(value = 1, message = "Question number must be >= 1")
    @Max(value = 32, message = "Question number must be <= 32")
    private Integer questionNumber;
    
    @NotBlank(message = "Original answer cannot be blank")
    private String originalAnswer;
    
    @NotBlank(message = "Corrected answer cannot be blank")
    private String correctedAnswer;
}
```

#### OcrMetadataDto
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class OcrMetadataDto {
    
    @DecimalMin(value = "0.0")
    @DecimalMax(value = "1.0")
    private BigDecimal overallConfidence;
    
    @Min(value = 0)
    private Integer processingTimeMs;
    
    private String tesseractVersion;
    
    // Additional fields for debugging
    private String ocrEngine;  // "tesseract", "mlkit", etc.
    private String language;    // "rus", "eng", etc.
    private Map<String, String> additionalData;
}
```

### Response DTOs

#### ScanSessionResponse
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ScanSessionResponse {
    
    private UUID id;
    private UUID testId;
    private UUID userId;
    
    private String status;  // PENDING, PROCESSING, COMPLETED, FAILED
    
    private Integer totalBlanks;
    private Integer processedBlanks;
    private Integer failedBlanks;
    
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Integer processingTimeMs;
    
    private String description;
    private String deviceId;
    private String deviceModel;
    
    private Map<String, String> metadata;
    
    // Audit
    private LocalDateTime createdAt;
}
```

#### ScannedBlankResponse
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ScannedBlankResponse {
    
    private UUID id;
    private UUID scanSessionId;
    private UUID testId;
    
    // Student info
    private String studentName;
    private String studentClass;
    private LocalDate testDate;
    
    // OCR Quality
    private BigDecimal overallConfidence;
    private Boolean needsReview;
    private String reviewStatus;  // PENDING, REVIEWED, CORRECTED, SKIPPED
    
    // Answers
    private Integer totalAnswers;
    private Integer answersWithReview;
    
    // Status
    private Boolean isScored;
    private String scoringStatus;
    
    // Timestamps
    private LocalDateTime scannedAt;
    private LocalDateTime processedAt;
    private LocalDateTime scoredAt;
    private LocalDateTime reviewedAt;
}
```

#### ScanProcessingResponse
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ScanProcessingResponse {
    
    private Boolean success;
    private Integer statusCode;
    private String message;
    
    @JsonProperty("data")
    private ScanProcessingData data;
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ScanProcessingData {
        private UUID blankId;
        private UUID sessionId;
        private String status;
        private Boolean needsReview;
        private BigDecimal confidenceScore;
    }
}
```

---

## 🔧 Services

### ScanSessionService Interface

```java
public interface ScanSessionService {
    
    /**
     * Create a new scan session
     * @param request Contains test ID, device info, metadata
     * @param currentUser Currently authenticated user
     * @return Created session details
     */
    ScanSessionResponse createScanSession(
        CreateScanSessionRequest request,
        User currentUser
    );
    
    /**
     * Get session by ID with all details
     */
    ScanSessionResponse getScanSession(UUID sessionId);
    
    /**
     * List all sessions for a specific test
     */
    List<ScanSessionResponse> getTestSessions(UUID testId);
    
    /**
     * List all sessions for current user
     */
    List<ScanSessionResponse> getUserSessions(UUID userId);
    
    /**
     * Update session status
     */
    void updateSessionStatus(UUID sessionId, String newStatus);
    
    /**
     * Complete session (mark as COMPLETED)
     */
    void completeScanSession(UUID sessionId);
    
    /**
     * Fail session (mark as FAILED)
     */
    void failScanSession(UUID sessionId, String errorMessage);
    
    /**
     * Update processing stats
     */
    void updateProcessingStats(
        UUID sessionId,
        Integer totalProcessed,
        Integer totalFailed
    );
}
```

### ScanSessionServiceImpl

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ScanSessionServiceImpl implements ScanSessionService {
    
    private final ScanSessionRepository scanSessionRepository;
    private final TestRepository testRepository;
    private final ModelMapper modelMapper;
    
    @Override
    public ScanSessionResponse createScanSession(
            CreateScanSessionRequest request,
            User currentUser) {
        
        // Validate test exists
        Test test = testRepository.findById(request.getTestId())
            .orElseThrow(() -> new NotFoundException("Test not found"));
        
        // Create new session
        ScanSession session = new ScanSession();
        session.setTest(test);
        session.setUser(currentUser);
        session.setDescription(request.getDescription());
        session.setDeviceId(request.getDeviceId());
        session.setDeviceModel(request.getDeviceModel());
        session.setStatus("PENDING");
        session.setTotalBlanks(0);
        session.setProcessedBlanks(0);
        session.setFailedBlanks(0);
        session.setStartedAt(LocalDateTime.now());
        
        if (request.getMetadata() != null) {
            session.setMetadata(mapToJsonb(request.getMetadata()));
        }
        
        ScanSession saved = scanSessionRepository.save(session);
        log.info("Created scan session {} for test {}", saved.getId(), test.getId());
        
        return modelMapper.map(saved, ScanSessionResponse.class);
    }
    
    @Override
    public ScanSessionResponse getScanSession(UUID sessionId) {
        ScanSession session = scanSessionRepository.findById(sessionId)
            .orElseThrow(() -> new NotFoundException("Scan session not found"));
        return modelMapper.map(session, ScanSessionResponse.class);
    }
    
    @Override
    public List<ScanSessionResponse> getTestSessions(UUID testId) {
        List<ScanSession> sessions = scanSessionRepository.findByTestId(testId);
        return sessions.stream()
            .map(s -> modelMapper.map(s, ScanSessionResponse.class))
            .collect(Collectors.toList());
    }
    
    @Override
    public List<ScanSessionResponse> getUserSessions(UUID userId) {
        List<ScanSession> sessions = scanSessionRepository.findByUserId(userId);
        return sessions.stream()
            .map(s -> modelMapper.map(s, ScanSessionResponse.class))
            .collect(Collectors.toList());
    }
    
    @Override
    public void updateSessionStatus(UUID sessionId, String newStatus) {
        ScanSession session = scanSessionRepository.findById(sessionId)
            .orElseThrow(() -> new NotFoundException("Scan session not found"));
        
        session.setStatus(newStatus);
        if ("COMPLETED".equals(newStatus)) {
            session.setCompletedAt(LocalDateTime.now());
        }
        
        scanSessionRepository.save(session);
    }
    
    @Override
    public void completeScanSession(UUID sessionId) {
        updateSessionStatus(sessionId, "COMPLETED");
    }
    
    @Override
    public void failScanSession(UUID sessionId, String errorMessage) {
        ScanSession session = scanSessionRepository.findById(sessionId)
            .orElseThrow(() -> new NotFoundException("Scan session not found"));
        
        session.setStatus("FAILED");
        session.setCompletedAt(LocalDateTime.now());
        // Store error in metadata or separate field
        
        scanSessionRepository.save(session);
    }
    
    @Override
    public void updateProcessingStats(UUID sessionId, Integer totalProcessed, Integer totalFailed) {
        ScanSession session = scanSessionRepository.findById(sessionId)
            .orElseThrow(() -> new NotFoundException("Scan session not found"));
        
        session.setProcessedBlanks(totalProcessed);
        session.setFailedBlanks(totalFailed);
        
        scanSessionRepository.save(session);
    }
    
    private String mapToJsonb(Map<String, String> metadata) {
        try {
            return new ObjectMapper().writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert metadata to JSON", e);
        }
    }
}
```

### ScannedBlankService Interface

```java
public interface ScannedBlankService {
    
    /**
     * Save a scanned blank with OCR data
     */
    ScannedBlankResponse saveScannedBlank(
        ProcessScanRequest request,
        UUID sessionId
    );
    
    /**
     * Get blank details by ID
     */
    ScannedBlankResponse getBlankDetails(UUID blankId);
    
    /**
     * List all blanks in a session
     */
    List<ScannedBlankResponse> getSessionBlanks(UUID sessionId);
    
    /**
     * Get blanks that need review
     */
    List<ScannedBlankResponse> getBlanksForReview(UUID sessionId);
    
    /**
     * Mark blank for manual review
     */
    void markForReview(UUID blankId, String reason);
    
    /**
     * Update review status
     */
    void updateReviewStatus(UUID blankId, String newStatus);
    
    /**
     * Update confidence score
     */
    void updateConfidence(UUID blankId, BigDecimal confidence);
}
```

### ScannedBlankServiceImpl

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ScannedBlankServiceImpl implements ScannedBlankService {
    
    private final ScannedBlankRepository scannedBlankRepository;
    private final ScanSessionRepository scanSessionRepository;
    private final TestRepository testRepository;
    private final ModelMapper modelMapper;
    
    private static final BigDecimal LOW_CONFIDENCE_THRESHOLD = new BigDecimal("0.85");
    
    @Override
    @Transactional
    public ScannedBlankResponse saveScannedBlank(
            ProcessScanRequest request,
            UUID sessionId) {
        
        // Validate session exists
        ScanSession session = scanSessionRepository.findById(sessionId)
            .orElseThrow(() -> new NotFoundException("Scan session not found"));
        
        // Create blank entity
        ScannedBlank blank = new ScannedBlank();
        blank.setScanSession(session);
        blank.setTest(session.getTest());
        blank.setStudentName(request.getStudentName());
        blank.setStudentClass(request.getStudentClass());
        blank.setTestDate(request.getTestDate());
        
        // Store answers as JSON
        blank.setAnswers(convertAnswersToJson(request.getAnswers()));
        
        // Store error corrections
        if (request.getErrorCorrections() != null && !request.getErrorCorrections().isEmpty()) {
            blank.setErrorCorrections(convertCorrectionsToJson(request.getErrorCorrections()));
        }
        
        // Set OCR metadata
        blank.setOverallConfidence(request.getOcrMetadata().getOverallConfidence());
        blank.setNeedsReview(
            request.getOcrMetadata().getOverallConfidence()
                .compareTo(LOW_CONFIDENCE_THRESHOLD) < 0
        );
        blank.setReviewStatus("PENDING");
        
        // Mark as not scored yet
        blank.setIsScored(false);
        blank.setScannedAt(LocalDateTime.now());
        
        ScannedBlank saved = scannedBlankRepository.save(blank);
        
        log.info("Saved scanned blank {} for session {}", saved.getId(), session.getId());
        
        return modelMapper.map(saved, ScannedBlankResponse.class);
    }
    
    @Override
    public ScannedBlankResponse getBlankDetails(UUID blankId) {
        ScannedBlank blank = scannedBlankRepository.findById(blankId)
            .orElseThrow(() -> new NotFoundException("Scanned blank not found"));
        return modelMapper.map(blank, ScannedBlankResponse.class);
    }
    
    @Override
    public List<ScannedBlankResponse> getSessionBlanks(UUID sessionId) {
        List<ScannedBlank> blanks = scannedBlankRepository.findByScanSessionId(sessionId);
        return blanks.stream()
            .map(b -> modelMapper.map(b, ScannedBlankResponse.class))
            .collect(Collectors.toList());
    }
    
    @Override
    public List<ScannedBlankResponse> getBlanksForReview(UUID sessionId) {
        List<ScannedBlank> blanks = scannedBlankRepository
            .findByScanSessionIdAndNeedsReviewTrue(sessionId);
        return blanks.stream()
            .map(b -> modelMapper.map(b, ScannedBlankResponse.class))
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public void markForReview(UUID blankId, String reason) {
        ScannedBlank blank = scannedBlankRepository.findById(blankId)
            .orElseThrow(() -> new NotFoundException("Scanned blank not found"));
        
        blank.setNeedsReview(true);
        blank.setReviewNotes(reason);
        blank.setReviewStatus("PENDING");
        
        scannedBlankRepository.save(blank);
    }
    
    @Override
    @Transactional
    public void updateReviewStatus(UUID blankId, String newStatus) {
        ScannedBlank blank = scannedBlankRepository.findById(blankId)
            .orElseThrow(() -> new NotFoundException("Scanned blank not found"));
        
        blank.setReviewStatus(newStatus);
        if ("REVIEWED".equals(newStatus)) {
            blank.setReviewedAt(LocalDateTime.now());
        }
        
        scannedBlankRepository.save(blank);
    }
    
    @Override
    @Transactional
    public void updateConfidence(UUID blankId, BigDecimal confidence) {
        ScannedBlank blank = scannedBlankRepository.findById(blankId)
            .orElseThrow(() -> new NotFoundException("Scanned blank not found"));
        
        blank.setOverallConfidence(confidence);
        blank.setNeedsReview(confidence.compareTo(LOW_CONFIDENCE_THRESHOLD) < 0);
        
        scannedBlankRepository.save(blank);
    }
    
    private String convertAnswersToJson(List<ScannedAnswerDto> answers) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.writeValueAsString(answers);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert answers to JSON", e);
        }
    }
    
    private String convertCorrectionsToJson(List<ErrorCorrectionDto> corrections) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.writeValueAsString(corrections);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert corrections to JSON", e);
        }
    }
}
```

---

## 🎮 Controller

```java
@RestController
@RequestMapping("/api/scans")
@RequiredArgsConstructor
@Slf4j
public class ScanController {
    
    private final ScanSessionService scanSessionService;
    private final ScannedBlankService scannedBlankService;
    private final AuthenticationService authenticationService;
    
    /**
     * Create a new scan session
     * POST /api/scans/sessions
     */
    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<ScanSessionResponse>> createScanSession(
            @Valid @RequestBody CreateScanSessionRequest request,
            HttpServletRequest httpRequest) {
        
        User currentUser = authenticationService.getCurrentUser();
        
        try {
            ScanSessionResponse response = scanSessionService.createScanSession(request, currentUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(response, "Scan session created successfully", HttpStatus.CREATED.value())
            );
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND.value())
            );
        } catch (Exception e) {
            log.error("Error creating scan session", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiResponse.error("Failed to create scan session", HttpStatus.INTERNAL_SERVER_ERROR.value())
            );
        }
    }
    
    /**
     * Process scan - main endpoint for OCR data
     * POST /api/scans/process
     */
    @PostMapping("/process")
    public ResponseEntity<ApiResponse<ScanProcessingResponse>> processScan(
            @Valid @RequestBody ProcessScanRequest request) {
        
        try {
            // Validate scan session exists
            ScanSessionResponse sessionResponse = scanSessionService.getScanSession(request.getScanSessionId());
            
            // Save blank
            ScannedBlankResponse blankResponse = scannedBlankService.saveScannedBlank(
                request,
                request.getScanSessionId()
            );
            
            // Create response
            ScanProcessingResponse.ScanProcessingData data = new ScanProcessingResponse.ScanProcessingData(
                blankResponse.getId(),
                blankResponse.getScanSessionId(),
                "STORED",
                blankResponse.getNeedsReview(),
                blankResponse.getOverallConfidence()
            );
            
            ScanProcessingResponse response = new ScanProcessingResponse(
                true,
                HttpStatus.CREATED.value(),
                "Scan processed successfully",
                data
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(response, "Scan processed successfully", HttpStatus.CREATED.value())
            );
            
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND.value())
            );
        } catch (Exception e) {
            log.error("Error processing scan", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiResponse.error("Failed to process scan", HttpStatus.INTERNAL_SERVER_ERROR.value())
            );
        }
    }
    
    /**
     * Get scan session details
     * GET /api/scans/sessions/{sessionId}
     */
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<ScanSessionResponse>> getScanSession(
            @PathVariable UUID sessionId) {
        
        try {
            ScanSessionResponse response = scanSessionService.getScanSession(sessionId);
            return ResponseEntity.ok(
                ApiResponse.success(response, "Scan session retrieved successfully", HttpStatus.OK.value())
            );
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND.value())
            );
        }
    }
    
    /**
     * Get blanks in session
     * GET /api/scans/sessions/{sessionId}/blanks
     */
    @GetMapping("/sessions/{sessionId}/blanks")
    public ResponseEntity<ApiResponse<List<ScannedBlankResponse>>> getSessionBlanks(
            @PathVariable UUID sessionId) {
        
        try {
            List<ScannedBlankResponse> blanks = scannedBlankService.getSessionBlanks(sessionId);
            return ResponseEntity.ok(
                ApiResponse.success(blanks, "Session blanks retrieved successfully", HttpStatus.OK.value())
            );
        } catch (Exception e) {
            log.error("Error retrieving session blanks", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiResponse.error("Failed to retrieve blanks", HttpStatus.INTERNAL_SERVER_ERROR.value())
            );
        }
    }
    
    /**
     * Get blanks needing review
     * GET /api/scans/sessions/{sessionId}/blanks/review
     */
    @GetMapping("/sessions/{sessionId}/blanks/review")
    public ResponseEntity<ApiResponse<List<ScannedBlankResponse>>> getBlanksForReview(
            @PathVariable UUID sessionId) {
        
        try {
            List<ScannedBlankResponse> blanks = scannedBlankService.getBlanksForReview(sessionId);
            return ResponseEntity.ok(
                ApiResponse.success(blanks, "Review blanks retrieved successfully", HttpStatus.OK.value())
            );
        } catch (Exception e) {
            log.error("Error retrieving review blanks", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiResponse.error("Failed to retrieve review blanks", HttpStatus.INTERNAL_SERVER_ERROR.value())
            );
        }
    }
}
```

---

## 📊 Repositories

```java
public interface ScanSessionRepository extends JpaRepository<ScanSession, UUID> {
    List<ScanSession> findByTestId(UUID testId);
    List<ScanSession> findByUserId(UUID userId);
    List<ScanSession> findByStatus(String status);
    List<ScanSession> findByTestIdAndStatus(UUID testId, String status);
}

public interface ScannedBlankRepository extends JpaRepository<ScannedBlank, UUID> {
    List<ScannedBlank> findByScanSessionId(UUID sessionId);
    List<ScannedBlank> findByScanSessionIdAndNeedsReviewTrue(UUID sessionId);
    List<ScannedBlank> findByTestId(UUID testId);
    List<ScannedBlank> findByStudentName(String studentName);
}
```

---

## 🗃️ Database Migrations (если используете Flyway)

Если используете Flyway, создайте файл:  
`src/main/resources/db/migration/V9__Create_Scan_Indexes.sql`

```sql
-- Indexes for scan_sessions
CREATE INDEX idx_scan_sessions_test_status 
  ON scan_sessions(test_id, status);

CREATE INDEX idx_scan_sessions_user_id 
  ON scan_sessions(user_id);

CREATE INDEX idx_scan_sessions_started 
  ON scan_sessions(started_at DESC);

-- Indexes for scanned_blanks
CREATE INDEX idx_scanned_blanks_session_scored 
  ON scanned_blanks(scan_session_id, is_scored);

CREATE INDEX idx_scanned_blanks_review 
  ON scanned_blanks(needs_review, review_status);

CREATE INDEX idx_scanned_blanks_confidence 
  ON scanned_blanks(overall_confidence);

CREATE INDEX idx_scanned_blanks_student 
  ON scanned_blanks(student_name, student_class);
```

---

## 📝 ModelMapper Configuration

В файле `AppConfig.java` (если используете ModelMapper):

```java
@Bean
public ModelMapper modelMapper() {
    ModelMapper mapper = new ModelMapper();
    
    // Mapping для ScanSession
    mapper.typeMap(ScanSession.class, ScanSessionResponse.class)
        .addMappings(m -> {
            m.map(src -> src.getTest().getId(), ScanSessionResponse::setTestId);
            m.map(src -> src.getUser().getId(), ScanSessionResponse::setUserId);
            m.skip(ScanSessionResponse::setCreatedAt); // Если не нужно
        });
    
    // Mapping для ScannedBlank
    mapper.typeMap(ScannedBlank.class, ScannedBlankResponse.class)
        .addMappings(m -> {
            m.map(src -> src.getScanSession().getId(), ScannedBlankResponse::setScanSessionId);
            m.map(src -> src.getTest().getId(), ScannedBlankResponse::setTestId);
        });
    
    return mapper;
}
```

---

## 🧪 Unit Tests (примеры)

```java
@SpringBootTest
@DisplayName("ScanSession Service Tests")
class ScanSessionServiceImplTest {
    
    @Mock
    private ScanSessionRepository scanSessionRepository;
    
    @Mock
    private TestRepository testRepository;
    
    @InjectMocks
    private ScanSessionServiceImpl service;
    
    @Test
    @DisplayName("Should create scan session successfully")
    void testCreateScanSession() {
        // Arrange
        CreateScanSessionRequest request = new CreateScanSessionRequest();
        request.setTestId(UUID.randomUUID());
        request.setDescription("Test session");
        request.setDeviceId("device-123");
        request.setDeviceModel("iPhone 14");
        
        User user = new User();
        user.setId(UUID.randomUUID());
        
        Test test = new Test();
        test.setId(request.getTestId());
        
        when(testRepository.findById(request.getTestId())).thenReturn(Optional.of(test));
        when(scanSessionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        
        // Act
        ScanSessionResponse response = service.createScanSession(request, user);
        
        // Assert
        assertNotNull(response);
        assertEquals(request.getTestId(), response.getTestId());
        assertEquals("PENDING", response.getStatus());
    }
}
```

---

## ✅ Checklist для Phase 1

- [ ] ScanSessionService interface создан
- [ ] ScanSessionServiceImpl реализован
- [ ] ScannedBlankService interface создан
- [ ] ScannedBlankServiceImpl реализован
- [ ] ScanController создан с 4 методами
- [ ] Все DTOs созданы и валидированы
- [ ] Repositories созданы
- [ ] ModelMapper конфигурация добавлена
- [ ] Индексы БД созданы
- [ ] Unit тесты написаны
- [ ] Интеграционные тесты написаны
- [ ] Swagger документация добавлена
- [ ] React Native может вызвать endpoints
- [ ] Все status codes правильные (201 для create, 200 для get, etc.)

---

**Next Step:** Когда будете готовы, начните с создания DTOs! 🚀

