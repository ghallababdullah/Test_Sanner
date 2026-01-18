package com.Ghallab.dev.Test_Scanner_backend.auth.security;

import com.Ghallab.dev.Test_Scanner_backend.common.exceptions.CustomAuthenticationEntryPoint;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Slf4j
@RequiredArgsConstructor
public class AuthFilter extends OncePerRequestFilter {
    private final JwtUtils jwtUtils;
    private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        log.info("🔐 [AuthFilter] Processing request: {} {}", request.getMethod(), request.getRequestURI());

        String token = getTokenFromRequest(request);

        if (token != null) {
            log.info("🔐 [AuthFilter] Token found in request");
            String email;

            try {
                email = jwtUtils.getUsernameFromToken(token);
                log.info("🔐 [AuthFilter] Email from token: {}", email);

            } catch (Exception ex) {
                log.error("❌ [AuthFilter] Error extracting email from token: {}", ex.getMessage());
                AuthenticationException authenticationException = new BadCredentialsException(ex.getMessage());
                customAuthenticationEntryPoint.commence(request, response, authenticationException);
                return;
            }

            UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
            log.info("🔐 [AuthFilter] UserDetails loaded for email: {}", email);
            log.info("🔐 [AuthFilter] Authorities: {}", userDetails.getAuthorities());

            if (jwtUtils.isTokenValid(token, userDetails)) {
                log.info("✅ [AuthFilter] Token is VALID for user: {}", email);
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities()
                );
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                log.info("✅ [AuthFilter] Authentication set in SecurityContext");
            } else {
                log.warn("❌ [AuthFilter] Token is INVALID for user: {}", email);
            }
        } else {
            log.debug("🔐 [AuthFilter] No token in request");
        }

        try {
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            log.error("❌ [AuthFilter] Error in filter chain: {}", e.getMessage());
        }
    }




    private String getTokenFromRequest(HttpServletRequest request) {
        String tokenWithBearer = request.getHeader("Authorization");
        if (tokenWithBearer != null && tokenWithBearer.startsWith("Bearer ")) {
            return tokenWithBearer.substring(7);
        }
        return null;
    }

}
