package com.Ghallab.dev.Test_Scanner_backend.auth.controller;

import com.Ghallab.dev.Test_Scanner_backend.auth.domain.service.AuthService;
import com.Ghallab.dev.Test_Scanner_backend.auth.dto.ChangePasswordRequest;
import com.Ghallab.dev.Test_Scanner_backend.auth.dto.LoginRequest;
import com.Ghallab.dev.Test_Scanner_backend.auth.dto.LoginResponse;
import com.Ghallab.dev.Test_Scanner_backend.auth.dto.RegistrationRequest;
import com.Ghallab.dev.Test_Scanner_backend.auth.dto.ResetPasswordRequest;
import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @PostMapping("/register")
    public ResponseEntity<Response<String>> register(@Valid @RequestBody RegistrationRequest registrationRequest) {
        log.info("Registration endpoint called for email: {}", registrationRequest.getEmail());
        Response<String> response = authService.register(registrationRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Response<LoginResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Login endpoint called for email: {}", loginRequest.getEmail());
        Response<LoginResponse> response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<Response<LoginResponse>> refreshToken(@RequestParam String refreshToken) {
        log.info("Refresh token endpoint called");
        Response<LoginResponse> response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@RequestParam String token) {
        log.info("Verify email endpoint called");
        try {
            Response<String> response = authService.verifyEmail(token);
            String message = URLEncoder.encode(response.getData(), StandardCharsets.UTF_8);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header(HttpHeaders.LOCATION, frontendBaseUrl + "/verify-email-result?status=success&message=" + message)
                    .build();
        } catch (Exception ex) {
            log.error("Verify email failed: {}", ex.getMessage(), ex);
            String message = URLEncoder.encode("Не удалось подтвердить почту. Ссылка может быть устаревшей.", StandardCharsets.UTF_8);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header(HttpHeaders.LOCATION, frontendBaseUrl + "/verify-email-result?status=error&message=" + message)
                    .build();
        }
    }

    @PostMapping("/forget-password")
    public ResponseEntity<Response<String>> forgetPassword(@RequestParam String email) {
        log.info("Forget password endpoint called for email: {}", email);
        Response<String> response = authService.forgetPassword(email);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Response<String>> resetPassword(
            @RequestParam String token,
            @Valid @RequestBody ResetPasswordRequest resetPasswordRequest
    ) {
        log.info("Reset password endpoint called");
        Response<String> response = authService.resetPassword(token, resetPasswordRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<Response<String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        log.info("Change password endpoint called");
        Response<String> response = authService.changePassword(request);
        return ResponseEntity.ok(response);
    }
}
