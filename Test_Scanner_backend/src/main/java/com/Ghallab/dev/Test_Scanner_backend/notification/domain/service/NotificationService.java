package com.Ghallab.dev.Test_Scanner_backend.notification.domain.service;

import com.Ghallab.dev.Test_Scanner_backend.auth.domain.entity.User;
import com.Ghallab.dev.Test_Scanner_backend.notification.dto.NotificationDto;

public interface NotificationService {

    void sendEmail(NotificationDto notificationDTO);
    void sendEmailAsync(NotificationDto notificationDTO);
    void sendEmailVerifiedNotification(User teacher);
}
