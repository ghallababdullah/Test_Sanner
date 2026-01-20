package com.Ghallab.dev.Test_Scanner_backend.auth.mapper;

import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import com.Ghallab.dev.Test_Scanner_backend.auth.dto.*;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.Collections;

/**
 * UserMapper - преобразует между User Entity и различными DTOs
 * Используется для преобразования данных пользователя для API
 */
@Component
public class UserMapper {

    private final ModelMapper modelMapper;

    public UserMapper(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }

    /**
     * Преобразует User Entity в UserResponse DTO
     * Используется при возврате пользователя в API
     */
    public UserResponse toUserResponse(User user) {
        return modelMapper.map(user, UserResponse.class);
    }

    /**
     * Преобразует User Entity в UserDto DTO
     */
    public UserDto toUserDto(User user) {
        return modelMapper.map(user, UserDto.class);
    }

    /**
     * Преобразует User Entity в LoginResponse DTO
     * Используется после успешного входа
     */
    public LoginResponse toLoginResponse(User user, String accessToken, String refreshToken) {
        LoginResponse response = modelMapper.map(user, LoginResponse.class);
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setEmail(user.getEmail());
        response.setMessage("Login successful");
        return response;
    }

    /**
     * Преобразует RegistrationRequest DTO в User Entity
     * ВАЖНО: Используется в AuthServiceImpl.register()
     */
    public User toUserEntity(RegistrationRequest request) {
        User user = modelMapper.map(request, User.class);
        // Установить роль по умолчанию
        user.setRoles(Collections.singletonList(User.Role.USER));
        // Активный по умолчанию после регистрации
        user.setActive(true);
        return user;
    }

    /**
     * Преобразует UserUpdateRequest DTO в User Entity
     */
    public void updateUserFromRequest(UserUpdateRequest request, User user) {
        modelMapper.map(request, user);
    }

    /**
     * Преобразует UserCreateRequest DTO в User Entity
     */
    public User toUserEntity(UserCreateRequest request) {
        User user = modelMapper.map(request, User.class);
        user.setRoles(Collections.singletonList(User.Role.USER));
        user.setActive(true);
        return user;
    }
}

