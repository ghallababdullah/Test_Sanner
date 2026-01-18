package com.Ghallab.dev.Test_Scanner_backend.security.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogPageResponse {

    private List<AuditLogResponse> content;

    private Long totalElements;

    private Integer totalPages;

    private Integer currentPage;

    private Integer pageSize;

    private Boolean hasNext;

    private Boolean hasPrevious;
}

