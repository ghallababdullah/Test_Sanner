package com.Ghallab.dev.Test_Scanner_backend.site.controller;

import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.site.dto.SiteContactRequest;
import com.Ghallab.dev.Test_Scanner_backend.site.service.SiteContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/site")
@RequiredArgsConstructor
@Slf4j
public class SiteContactController {

    private final SiteContactService siteContactService;

    @PostMapping("/contact")
    public ResponseEntity<Response<String>> sendContactMessage(@Valid @RequestBody SiteContactRequest request) {
        log.info("Site contact endpoint called. type={} email={}", request.getType(), request.getEmail());
        return ResponseEntity.ok(siteContactService.sendContactMessage(request));
    }
}
