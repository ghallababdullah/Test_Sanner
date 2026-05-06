package com.Ghallab.dev.Test_Scanner_backend.auth.security;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter(){
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Local development for browser and phone in the same network
        config.addAllowedOriginPattern("http://localhost:5173");
        config.addAllowedOriginPattern("http://127.0.0.1:5173");
        config.addAllowedOriginPattern("http://192.168.56.1:5173");
        config.addAllowedOriginPattern("http://192.168.0.17:5173");

        // Allow all headers
        config.addAllowedHeader("*");

        // Allow all methods (GET, POST, PUT, DELETE, etc.)
        config.addAllowedMethod("*");

        // Allow credentials (cookies, authorization headers)
        config.setAllowCredentials(true);

        // Cache preflight response for 1 hour
        config.setMaxAge(3600L);

        // Apply to all endpoints
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
