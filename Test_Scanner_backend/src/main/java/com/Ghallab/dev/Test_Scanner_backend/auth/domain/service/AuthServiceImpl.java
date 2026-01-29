package com.Ghallab.dev.Test_Scanner_backend.auth.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import com.Ghallab.dev.Test_Scanner_backend.auth.domain.repository.UserRepository;
import com.Ghallab.dev.Test_Scanner_backend.auth.dto.*;
import com.Ghallab.dev.Test_Scanner_backend.auth.mapper.UserMapper;
import com.Ghallab.dev.Test_Scanner_backend.auth.security.TokenService;
import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.common.exceptions.BadRequestException;
import com.Ghallab.dev.Test_Scanner_backend.common.exceptions.NotFoundException;
import com.Ghallab.dev.Test_Scanner_backend.notification.domain.service.NotificationService;
import com.Ghallab.dev.Test_Scanner_backend.notification.dto.NotificationDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final TokenService tokenService;
    private final UserMapper userMapper; // ✅ ИСПОЛЬЗУЕМ MAPPER

    @Override
    @Transactional
    public Response<String> register(RegistrationRequest request) {
        log.info("📝 Starting user registration for email: {}", request.getEmail());

        // Проверка, существует ли уже пользователь
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            log.warn("❌ Registration failed: Email already exists - {}", request.getEmail());
            throw new BadRequestException("Email already exists");
        }

        // ✅ ИСПОЛЬЗУЕМ MAPPER для преобразования RegistrationRequest → User Entity
        User user = userMapper.toUserEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);
        log.info("✅ User registered successfully: {}", savedUser.getId());

        // Генерируем токен для проверки email
        String emailVerificationToken = tokenService.generateEmailVerificationToken(savedUser.getEmail());

        // Отправляем email с подтверждением
        Map<String, Object> templateVariables = new HashMap<>();
        templateVariables.put("firstName", savedUser.getFirstName());
        templateVariables.put("lastName", savedUser.getLastName());
        templateVariables.put("verificationLink", "http://localhost:8080/api/auth/verify-email?token=" + emailVerificationToken);

        NotificationDto verificationEmail = NotificationDto.builder()
                .recipient(savedUser.getEmail())
                .title("Подтверждение электронной почты")
                .templateName("verify-email")
                .templateVariable(templateVariables)
                .build();

        try {
            notificationService.sendEmail(verificationEmail);
            log.info("✅ Verification email sent to: {}", savedUser.getEmail());
        } catch (Exception e) {
            log.error("❌ Failed to send verification email: {}", e.getMessage());
        }

        return Response.<String>builder()
                .success(true)
                .message("User registered successfully. Please check your email to verify.")
                .data("Registration successful")
                .build();
    }

    @Override
    @Transactional
    public Response<LoginResponse> login(LoginRequest loginRequest) {
        log.info("🔐 User login attempt for email: {}", loginRequest.getEmail());

        // Найти пользователя по email
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> {
                    log.warn("❌ Login failed: User not found - {}", loginRequest.getEmail());
                    return new NotFoundException("Invalid email or password");
                });

        // Проверить пароль
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            log.warn("❌ Login failed: Invalid password for user - {}", loginRequest.getEmail());
            throw new BadRequestException("Invalid email or password");
        }

        // Проверить, активен ли пользователь
        if (!user.isActive()) {
            log.warn("❌ Login failed: User account is inactive - {}", loginRequest.getEmail());
            throw new BadRequestException("User account is inactive");
        }

        // Обновить время последнего входа
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Генерировать токены
        String accessToken = tokenService.generateToken(user.getEmail());
        String refreshToken = tokenService.generateRefreshToken(user.getEmail());

        log.info("✅ User logged in successfully: {}", user.getId());

        // ✅ ИСПОЛЬЗУЕМ MAPPER для преобразования User Entity → LoginResponse DTO
        LoginResponse loginResponse = userMapper.toLoginResponse(user, accessToken, refreshToken);

        return Response.<LoginResponse>builder()
                .success(true)
                .message("Login successful")
                .data(loginResponse)
                .build();
    }

    @Override
    @Transactional
    public Response<LoginResponse> refreshToken(String refreshToken) {
        log.info("🔄 Refreshing token...");

        try {
            // Проверить, что это refresh токен
            String tokenType = tokenService.findTypeofToken(refreshToken);
            if (!"REFRESH".equals(tokenType)) {
                log.warn("❌ Token refresh failed: Invalid token type");
                throw new BadRequestException("Invalid token type");
            }

            // Получить email из токена
            String email = tokenService.getUsernameFromToken(refreshToken);

            // Найти пользователя
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> {
                        log.warn("❌ Token refresh failed: User not found - {}", email);
                        return new NotFoundException("User not found");
                    });

            // Проверить, активен ли пользователь
            if (!user.isActive()) {
                throw new BadRequestException("User account is inactive");
            }

            // Генерировать новые токены
            String newAccessToken = tokenService.generateToken(user.getEmail());
            String newRefreshToken = tokenService.generateRefreshToken(user.getEmail());

            log.info("✅ Token refreshed successfully for user: {}", email);

            // ✅ ИСПОЛЬЗУЕМ MAPPER
            LoginResponse loginResponse = userMapper.toLoginResponse(user, newAccessToken, newRefreshToken);
            loginResponse.setMessage("Token refreshed successfully");

            return Response.<LoginResponse>builder()
                    .success(true)
                    .message("Token refreshed successfully")
                    .data(loginResponse)
                    .build();
        } catch (Exception e) {
            log.error("❌ Token refresh failed: {}", e.getMessage());
            throw new BadRequestException("Invalid or expired refresh token: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Response<String> verifyEmail(String token) {
        log.info("📧 Verifying email with token...");

        try {
            // Получить email из токена
            String email = tokenService.getUsernameFromToken(token);

            // Найти пользователя
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new NotFoundException("User not found"));


            user.setVerified(true);
            userRepository.save(user);  // ✅ СОХРАНЯЕМ ИЗМЕНЕНИЯ В БД
          /*  // Отправляем email с подтверждением
            Map<String, Object> templateVariables = new HashMap<>();
            templateVariables.put("firstName", user.getFirstName());
            templateVariables.put("lastName", user.getLastName());

            NotificationDto verificationEmail = NotificationDto.builder()
                    .recipient(user.getEmail())
                    .title("Почта успешно подтверждена")
                    .templateName("congrats-email")
                    .templateVariable(templateVariables)
                    .build();*/
            log.info("✅ Email verified successfully for user: {}", email);

            return Response.<String>builder()
                    .success(true)
                    .message("Email verified successfully")
                    .data("Your email has been verified. You can now log in.")
                    .build();
        } catch (Exception e) {
            log.error("❌ Email verification failed: {}", e.getMessage());
            throw new BadRequestException("Invalid or expired verification token: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Response<String> forgetPassword(String email) {
        log.info("🔑 Password reset requested for email: {}", email);

        // Найти пользователя по email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("❌ Password reset failed: User not found - {}", email);
                    return new NotFoundException("User not found");
                });

        // Генерировать токен для сброса пароля
        String passwordResetToken = tokenService.generatePasswordResetToken(email);

        // Отправить email с ссылкой для сброса пароля
        Map<String, Object> templateVariables = new HashMap<>();
        templateVariables.put("firstName", user.getFirstName());
        templateVariables.put("resetLink", "http://localhost:8080/api/auth/reset-password?token=" + passwordResetToken);

        NotificationDto resetEmail = NotificationDto.builder()
                .recipient(email)
                .title("Сброс пароля")
                .templateName("password-reset")
                .templateVariable(templateVariables)
                .build();

        try {
            notificationService.sendEmail(resetEmail);
            log.info("✅ Password reset email sent to: {}", email);
        } catch (Exception e) {
            log.error("❌ Failed to send password reset email: {}", e.getMessage());
        }

        return Response.<String>builder()
                .success(true)
                .message("Password reset email sent. Please check your email.")
                .data("Reset email sent")
                .build();
    }

    @Override
    @Transactional
    public Response<String> resetPassword(String token, ResetPasswordRequest request) {
        log.info("🔄 Processing password reset...");

        try {
            // Валидировать токен и получить email
            String email = tokenService.validatePasswordResetToken(token);

            // Найти пользователя
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new NotFoundException("User not found"));

            // Проверить, что пароли совпадают
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                throw new BadRequestException("Passwords do not match");
            }

            // Обновить пароль
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);

            log.info("✅ Password reset successfully for user: {}", email);

            return Response.<String>builder()
                    .success(true)
                    .message("Password reset successfully")
                    .data("Your password has been reset. You can now log in with your new password.")
                    .build();
        } catch (Exception e) {
            log.error("❌ Password reset failed: {}", e.getMessage());
            throw new BadRequestException("Invalid or expired reset token: " + e.getMessage());
        }
    }
}
