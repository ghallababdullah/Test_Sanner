package com.Ghallab.dev.Test_Scanner_backend.auth.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

@Service
public class AuthCookieService {

    @Value("${app.auth.cookies.access-token-name:skanproverka_access_token}")
    private String accessTokenCookieName;

    @Value("${app.auth.cookies.refresh-token-name:skanproverka_refresh_token}")
    private String refreshTokenCookieName;

    @Value("${app.auth.cookies.same-site:Lax}")
    private String sameSite;

    @Value("${app.auth.cookies.domain:}")
    private String cookieDomain;

    @Value("${app.auth.cookies.force-secure:false}")
    private boolean forceSecure;

    public void setAuthCookies(HttpServletRequest request, HttpServletResponse response, String accessToken, String refreshToken) {
        boolean secure = isSecureRequest(request);
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(accessTokenCookieName, accessToken, secure, Duration.ofHours(1)).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(refreshTokenCookieName, refreshToken, secure, Duration.ofDays(30)).toString());
    }

    public void clearAuthCookies(HttpServletRequest request, HttpServletResponse response) {
        boolean secure = isSecureRequest(request);
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(accessTokenCookieName, "", secure, Duration.ZERO).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(refreshTokenCookieName, "", secure, Duration.ZERO).toString());
    }

    public String extractAccessToken(HttpServletRequest request) {
        return extractCookieValue(request, accessTokenCookieName);
    }

    public String extractRefreshToken(HttpServletRequest request) {
        return extractCookieValue(request, refreshTokenCookieName);
    }

    private ResponseCookie buildCookie(String name, String value, boolean secure, Duration maxAge) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(maxAge);

        if (cookieDomain != null && !cookieDomain.isBlank()) {
            builder.domain(cookieDomain);
        }

        return builder.build();
    }

    private String extractCookieValue(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null || cookies.length == 0) {
            return null;
        }

        Optional<Cookie> match = Arrays.stream(cookies)
                .filter(cookie -> cookieName.equals(cookie.getName()))
                .findFirst();

        return match.map(Cookie::getValue).orElse(null);
    }

    private boolean isSecureRequest(HttpServletRequest request) {
        if (forceSecure) {
            return true;
        }

        if (request.isSecure()) {
            return true;
        }

        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        return forwardedProto != null && forwardedProto.equalsIgnoreCase("https");
    }
}
