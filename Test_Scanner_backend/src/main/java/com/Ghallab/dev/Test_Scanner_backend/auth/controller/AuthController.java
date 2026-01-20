package com.Ghallab.dev.Test_Scanner_backend.auth.controller;

import com.Ghallab.dev.Test_Scanner_backend.auth.domain.service.AuthService;
import com.Ghallab.dev.Test_Scanner_backend.auth.dto.*;
import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/**
 * AuthController - REST API для аутентификации и авторизации
 * Обрабатывает все операции связанные с регистрацией, входом, и управлением паролем
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/register
     * Регистрация нового пользователя
     *
     * @param registrationRequest данные для регистрации
     * @return Response с сообщением об успешной регистрации
     */
    @PostMapping("/register")
    public ResponseEntity<Response<String>> register(@Valid @RequestBody RegistrationRequest registrationRequest) {
        log.info("📝 Registration endpoint called for email: {}", registrationRequest.getEmail());
        Response<String> response = authService.register(registrationRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /api/auth/login
     * Вход пользователя в приложение
     *
     * @param loginRequest email и пароль
     * @return Response с accessToken, refreshToken и информацией о пользователе
     */
    @PostMapping("/login")
    public ResponseEntity<Response<LoginResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("🔐 Login endpoint called for email: {}", loginRequest.getEmail());
        Response<LoginResponse> response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/refresh-token
     * Обновление accessToken используя refreshToken
     *
     * @param refreshToken refresh токен
     * @return Response с новыми accessToken и refreshToken
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<Response<LoginResponse>> refreshToken(@RequestParam String refreshToken) {
        log.info("🔄 Refresh token endpoint called");
        Response<LoginResponse> response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/auth/verify-email
     * Проверка email по токену из ссылки в письме
     *
     * @param token токен проверки email
     * @return Response с сообщением об успешной проверке
     */
    @GetMapping("/verify-email")
    public ResponseEntity<Response<String>> verifyEmail(@RequestParam String token) {
        log.info("📧 Verify email endpoint called");
        Response<String> response = authService.verifyEmail(token);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/forget-password
     * Инициирование процесса восстановления пароля
     * Отправляет email с ссылкой для сброса пароля
     *
     * @param email email пользователя
     * @return Response с сообщением об отправке письма
     */
    @PostMapping("/forget-password")
    public ResponseEntity<Response<String>> forgetPassword(@RequestParam String email) {
        log.info("🔑 Forget password endpoint called for email: {}", email);
        Response<String> response = authService.forgetPassword(email);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/reset-password
     * Сброс пароля используя токен из письма
     *
     * @param token токен сброса пароля
     * @param resetPasswordRequest новый пароль и подтверждение
     * @return Response с сообщением об успешном сбросе
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Response<String>> resetPassword(
            @RequestParam String token,
            @Valid @RequestBody ResetPasswordRequest resetPasswordRequest) {
        log.info("🔄 Reset password endpoint called");
        Response<String> response = authService.resetPassword(token, resetPasswordRequest);
        return ResponseEntity.ok(response);
    }
}

