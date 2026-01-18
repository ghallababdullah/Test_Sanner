package com.Ghallab.dev.Test_Scanner_backend.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MarkAsReadRequest {

    private Boolean isRead;

    private Boolean isArchived;
}

