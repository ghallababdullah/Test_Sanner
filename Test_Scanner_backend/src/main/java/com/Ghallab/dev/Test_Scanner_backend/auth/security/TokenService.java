package com.Ghallab.dev.Test_Scanner_backend.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

public class TokenService {

    @Value("${jwt.secret.string}")
    private String JWT_SECRETE;

    private static  final long EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour
    private static  final long REFRESH_TOKEN_EXPIRATION = 30L *24 * 60 * 60 * 1000 ;
    private long PASSWORD_RESET_EXPIRATION_TIME  = 60 * 60 * 1000;

    private SecretKey key;

    @PostConstruct
    private void init() {
        byte[] keyByte = JWT_SECRETE.getBytes(StandardCharsets.UTF_8);
        this.key = new SecretKeySpec(keyByte, 0, keyByte.length, "HmacSHA256");
    }
    public String generateToken(String email) {
        return Jwts.builder()
                .subject(email)
                .claim("type", "ACCESS")
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
    // Refresh token (long-lived)
    public String generateRefreshToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .claim("type", "REFRESH")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
    public String generateEmailVerificationToken(String email) {
        return Jwts.builder()
                .subject(email)
                .claim("type", "EMAIL_VERIFICATION")
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + 24 * 60 * 60 * 1000))//24
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // Генерирует токен для сброса пароля (1 час)
    public String generatePasswordResetToken(String email) {
        return Jwts.builder()
                .subject(email)
                .claim("type", "PASSWORD_RESET")
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + PASSWORD_RESET_EXPIRATION_TIME))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
    public String validatePasswordResetToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String type = claims.get("type", String.class);
            if (!"PASSWORD_RESET".equals(type)) {
                throw new RuntimeException("Invalid token type");
            }

            return claims.getSubject();
        } catch (Exception e) {
            throw new RuntimeException("Invalid or expired reset token: " + e.getMessage());
        }
    }

    public String getUsernameFromToken(String token) {
        return extractClaims(token, Claims::getSubject);
    }

    private <T> T extractClaims(String token, Function<Claims, T> claimsTFunction) {
        return claimsTFunction.apply(
                Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload()
        );
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = getUsernameFromToken(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    public boolean isRefreshTokenValid(String token, UserDetails userDetails) {
        try {

            String type= extractClaims(token, claims -> claims.get("type", String.class)) ;
            if (!"REFRESH".equals(type)) {
                return false; // token is not a refresh token
            }

            // Extract username from token
            final String username = extractClaims(token, Claims::getSubject);

            // Validate username and expiration
            return username.equals(userDetails.getUsername()) && !isRefreshTokenExpired(token);

        } catch (Exception e) {
            // Any parsing or validation error → token invalid
            return false;
        }
    }


    private boolean isTokenExpired(String token) {
        return extractClaims(token, Claims::getExpiration).before(new Date());
    }
    private boolean isRefreshTokenExpired(String Refreshtoken) {
        return extractClaims(Refreshtoken, Claims::getExpiration).before(new Date());
    }

    public String findTypeofToken(String token){
        return extractClaims(token, claims -> claims.get("type", String.class)) ;
    }
}
