package com.Ghallab.dev.Test_Scanner_backend.auth.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import com.Ghallab.dev.Test_Scanner_backend.auth.domain.repository.UserRepository;
import com.Ghallab.dev.Test_Scanner_backend.auth.dto.ChangePasswordRequest;
import com.Ghallab.dev.Test_Scanner_backend.auth.dto.LoginRequest;
import com.Ghallab.dev.Test_Scanner_backend.auth.dto.LoginResponse;
import com.Ghallab.dev.Test_Scanner_backend.auth.dto.RegistrationRequest;
import com.Ghallab.dev.Test_Scanner_backend.auth.dto.ResetPasswordRequest;
import com.Ghallab.dev.Test_Scanner_backend.auth.mapper.UserMapper;
import com.Ghallab.dev.Test_Scanner_backend.auth.security.TokenService;
import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.common.exceptions.BadRequestException;
import com.Ghallab.dev.Test_Scanner_backend.common.exceptions.NotFoundException;
import com.Ghallab.dev.Test_Scanner_backend.notification.domain.service.NotificationService;
import com.Ghallab.dev.Test_Scanner_backend.notification.dto.NotificationDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final UserMapper userMapper;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @Value("${app.backend.public-base-url}")
    private String backendPublicBaseUrl;

    @Override
    @Transactional
    public Response<String> register(RegistrationRequest request) {
        log.info("Starting user registration for email: {}", request.getEmail());

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            log.warn("Registration failed: email already exists - {}", request.getEmail());
            throw new BadRequestException("Email already exists");
        }

        User user = userMapper.toUserEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {}", savedUser.getId());

        String emailVerificationToken = tokenService.generateEmailVerificationToken(savedUser.getEmail());

        Map<String, Object> templateVariables = new HashMap<>();
        templateVariables.put("firstName", savedUser.getFirstName());
        templateVariables.put("lastName", savedUser.getLastName());
        templateVariables.put("verificationLink", backendPublicBaseUrl + "/api/auth/verify-email?token=" + emailVerificationToken);
        templateVariables.put("loginLink", frontendBaseUrl + "/login");

        NotificationDto verificationEmail = NotificationDto.builder()
                .recipient(savedUser.getEmail())
                .title("Подтвердите электронную почту")
                .templateName("verify-email")
                .templateVariable(templateVariables)
                .build();

        notificationService.sendEmailAsync(verificationEmail);
        log.info("Verification email queued for: {}", savedUser.getEmail());

        return Response.<String>builder()
                .success(true)
                .message("Регистрация завершена. Проверьте почту и подтвердите адрес, чтобы продолжить работу.")
                .data("Registration successful")
                .build();
    }

    @Override
    @Transactional
    public Response<LoginResponse> login(LoginRequest loginRequest) {
        log.info("User login attempt for email: {}", loginRequest.getEmail());

        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new NotFoundException("Invalid email or password"));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new BadRequestException("User account is inactive");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = tokenService.generateToken(user.getEmail());
        String refreshToken = tokenService.generateRefreshToken(user.getEmail());

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
        log.info("Refreshing token");

        try {
            String tokenType = tokenService.findTypeofToken(refreshToken);
            if (!"REFRESH".equals(tokenType)) {
                throw new BadRequestException("Invalid token type");
            }

            String email = tokenService.getUsernameFromToken(refreshToken);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new NotFoundException("User not found"));

            if (!user.isActive()) {
                throw new BadRequestException("User account is inactive");
            }

            String newAccessToken = tokenService.generateToken(user.getEmail());
            String newRefreshToken = tokenService.generateRefreshToken(user.getEmail());

            LoginResponse loginResponse = userMapper.toLoginResponse(user, newAccessToken, newRefreshToken);
            loginResponse.setMessage("Token refreshed successfully");

            return Response.<LoginResponse>builder()
                    .success(true)
                    .message("Token refreshed successfully")
                    .data(loginResponse)
                    .build();
        } catch (Exception e) {
            log.error("Token refresh failed: {}", e.getMessage(), e);
            throw new BadRequestException("Invalid or expired refresh token: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Response<String> verifyEmail(String token) {
        log.info("Verifying email by token");

        try {
            String email = tokenService.getUsernameFromToken(token);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new NotFoundException("User not found"));

            user.setVerified(true);
            userRepository.save(user);

            log.info("Email verified successfully for user: {}", email);

            return Response.<String>builder()
                    .success(true)
                    .message("Email verified successfully")
                    .data("Your email has been verified. You can now log in.")
                    .build();
        } catch (Exception e) {
            log.error("Email verification failed: {}", e.getMessage(), e);
            throw new BadRequestException("Invalid or expired verification token: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Response<String> forgetPassword(String email) {
        log.info("Password reset requested for email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));

        String passwordResetToken = tokenService.generatePasswordResetToken(email);

        Map<String, Object> templateVariables = new HashMap<>();
        templateVariables.put("firstName", user.getFirstName());
        templateVariables.put("resetLink", frontendBaseUrl + "/reset-password?token=" + passwordResetToken);
        templateVariables.put("loginLink", frontendBaseUrl + "/login");

        NotificationDto resetEmail = NotificationDto.builder()
                .recipient(email)
                .title("Сброс пароля")
                .templateName("password-reset")
                .templateVariable(templateVariables)
                .build();

        notificationService.sendEmailAsync(resetEmail);
        log.info("Password reset email queued for: {}", email);

        return Response.<String>builder()
                .success(true)
                .message("Запрос принят. Если адрес найден, письмо для сброса пароля придёт на вашу почту.")
                .data("Reset email sent")
                .build();
    }

    @Override
    @Transactional
    public Response<String> resetPassword(String token, ResetPasswordRequest request) {
        log.info("Processing password reset");

        try {
            String email = tokenService.validatePasswordResetToken(token);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new NotFoundException("User not found"));

            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                throw new BadRequestException("Passwords do not match");
            }

            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);

            log.info("Password reset successfully for user: {}", email);

            return Response.<String>builder()
                    .success(true)
                    .message("Password reset successfully")
                    .data("Your password has been reset. You can now log in with your new password.")
                    .build();
        } catch (Exception e) {
            log.error("Password reset failed: {}", e.getMessage(), e);
            throw new BadRequestException("Invalid or expired reset token: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Response<String> changePassword(ChangePasswordRequest request) {
        User currentUser = getCurrentUser();
        log.info("Changing password for user: {}", currentUser.getEmail());

        if (!passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirmation do not match");
        }

        if (passwordEncoder.matches(request.getNewPassword(), currentUser.getPasswordHash())) {
            throw new BadRequestException("New password must be different from the current password");
        }

        currentUser.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(currentUser);

        return Response.<String>builder()
                .success(true)
                .message("Password changed successfully")
                .data("Password changed successfully")
                .build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new BadRequestException("Authenticated user not found");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new NotFoundException("Authenticated user not found"));
    }
}
