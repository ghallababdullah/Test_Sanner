package com.Ghallab.dev.Test_Scanner_backend.security;

import com.Ghallab.dev.Test_Scanner_backend.common.exceptions.TooManyRequestsException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final String LOGIN_KEY = "POST:/api/auth/login";
    private static final String FORGOT_PASSWORD_KEY = "POST:/api/auth/forget-password";
    private static final String RESET_PASSWORD_KEY = "POST:/api/auth/reset-password";
    private static final String CONTACT_KEY = "POST:/api/site/contact";
    private static final String SUBMIT_BLANK_KEY = "POST:/api/scan/submit-blank";
    private static final String SUBMIT_PREVIEW_KEY = "POST:/api/scan/submit-blank-preview";

    private final Map<String, RateLimitRule> rules = Map.of(
            LOGIN_KEY, new RateLimitRule(5, Duration.ofMinutes(1), "Слишком много попыток входа. Подождите минуту и попробуйте снова."),
            FORGOT_PASSWORD_KEY, new RateLimitRule(3, Duration.ofMinutes(10), "Слишком много запросов на сброс пароля. Попробуйте позже."),
            RESET_PASSWORD_KEY, new RateLimitRule(5, Duration.ofMinutes(10), "Слишком много попыток смены пароля по ссылке. Попробуйте позже."),
            CONTACT_KEY, new RateLimitRule(5, Duration.ofMinutes(30), "Слишком много обращений. Попробуйте отправить сообщение позже."),
            SUBMIT_BLANK_KEY, new RateLimitRule(20, Duration.ofMinutes(10), "Слишком много загрузок бланков. Подождите немного и попробуйте снова."),
            SUBMIT_PREVIEW_KEY, new RateLimitRule(20, Duration.ofMinutes(10), "Слишком много загрузок бланков. Подождите немного и попробуйте снова.")
    );

    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String requestKey = request.getMethod() + ":" + request.getRequestURI();
        RateLimitRule rule = rules.get(requestKey);
        if (rule == null) {
            return true;
        }

        String clientKey = resolveClientIdentifier(request) + "|" + requestKey;
        WindowCounter counter = counters.computeIfAbsent(clientKey, ignored -> new WindowCounter());

        synchronized (counter) {
            long now = System.currentTimeMillis();
            if (now >= counter.windowEndsAtMillis) {
                counter.windowEndsAtMillis = now + rule.window().toMillis();
                counter.requestCount = 0;
            }

            counter.requestCount++;
            if (counter.requestCount > rule.maxRequests()) {
                throw new TooManyRequestsException(rule.message());
            }
        }

        return true;
    }

    private String resolveClientIdentifier(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return Objects.toString(request.getRemoteAddr(), "unknown");
    }

    private record RateLimitRule(int maxRequests, Duration window, String message) {
    }

    private static final class WindowCounter {
        private long windowEndsAtMillis;
        private int requestCount;
    }
}
