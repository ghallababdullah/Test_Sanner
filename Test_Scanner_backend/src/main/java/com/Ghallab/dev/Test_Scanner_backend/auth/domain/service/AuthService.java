package com.Ghallab.dev.Test_Scanner_backend.auth.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.auth.dto.ChangePasswordRequest;
import com.Ghallab.dev.Test_Scanner_backend.auth.dto.LoginRequest;
import com.Ghallab.dev.Test_Scanner_backend.auth.dto.LoginResponse;
import com.Ghallab.dev.Test_Scanner_backend.auth.dto.RegistrationRequest;
import com.Ghallab.dev.Test_Scanner_backend.auth.dto.ResetPasswordRequest;
import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;

public interface AuthService {
    Response<String> register(RegistrationRequest request);
    Response<LoginResponse> login(LoginRequest loginRequest);
    Response<LoginResponse> refreshToken(String refreshToken);
    Response<String> verifyEmail(String token);
    Response<String> forgetPassword(String email);
    Response<String> resetPassword(String token, ResetPasswordRequest request);
    Response<String> changePassword(ChangePasswordRequest request);
}
