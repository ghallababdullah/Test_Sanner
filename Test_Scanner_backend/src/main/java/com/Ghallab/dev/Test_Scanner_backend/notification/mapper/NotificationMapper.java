package com.Ghallab.dev.Test_Scanner_backend.notification.mapper;

import com.Ghallab.dev.Test_Scanner_backend.notification.domain.entity.Notification;
import com.Ghallab.dev.Test_Scanner_backend.notification.dto.NotificationResponse;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * NotificationMapper - преобразует между Notification Entity и NotificationResponse DTO
 * Используется для преобразования данных уведомлений для API
 */
@Component
public class NotificationMapper {

    private final ModelMapper modelMapper;

    public NotificationMapper(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }

    /**
     * Преобразует Notification Entity в NotificationResponse DTO
     * Используется при возврате уведомления в API
     * Ручное маппинг: user → userId
     */
    public NotificationResponse toNotificationResponse(Notification notification) {
        NotificationResponse response = modelMapper.map(notification, NotificationResponse.class);

        // ✅ Ручное маппинг для User → UserId
        if (notification.getUser() != null) {
            response.setUserId(notification.getUser().getId());
        }

        return response;
    }

    /**
     * Преобразует список Notification в список NotificationResponse
     */
    public List<NotificationResponse> toNotificationResponseList(List<Notification> notifications) {
        return notifications.stream()
                .map(this::toNotificationResponse)
                .collect(Collectors.toList());
    }
}

