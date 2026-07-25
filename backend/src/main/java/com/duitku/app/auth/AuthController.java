package com.duitku.app.auth;

import com.duitku.app.auth.dto.AuthResult;
import com.duitku.app.auth.dto.LoginRequest;
import com.duitku.app.auth.dto.RegisterRequest;
import com.duitku.app.auth.dto.TokenResponse;
import com.duitku.app.auth.dto.UserResponse;
import com.duitku.app.auth.repository.UserRepository;
import com.duitku.app.common.exception.InvalidRefreshTokenException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    static final String REFRESH_COOKIE_NAME = "duitku_refresh_token";
    private static final long REFRESH_COOKIE_MAX_AGE_SECONDS = 7L * 24 * 60 * 60;

    private final AuthService authService;
    private final UserRepository userRepository;
    private final boolean cookieSecure;
    private final String cookieSameSite;

    public AuthController(
            AuthService authService,
            UserRepository userRepository,
            @Value("${duitku.cookie.secure}") boolean cookieSecure,
            @Value("${duitku.cookie.same-site}") String cookieSameSite) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
    }

    @PostMapping("/register")
    public ResponseEntity<TokenResponse> register(@Valid @RequestBody RegisterRequest request) {
        return withRefreshCookie(authService.register(request), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return withRefreshCookie(authService.login(request), HttpStatus.OK);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken) {
        if (refreshToken == null) {
            throw new InvalidRefreshTokenException("Refresh token tidak ditemukan");
        }
        return withRefreshCookie(authService.refresh(refreshToken), HttpStatus.OK);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken) {
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }
        ResponseCookie expiredCookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/api/v1/auth")
                .maxAge(0)
                .build();
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, expiredCookie.toString())
                .build();
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        return userRepository.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> new IllegalStateException("Authenticated user no longer exists"));
    }

    private ResponseCookie refreshCookie(String rawToken) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, rawToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/api/v1/auth")
                .maxAge(REFRESH_COOKIE_MAX_AGE_SECONDS)
                .build();
    }

    private ResponseEntity<TokenResponse> withRefreshCookie(AuthResult result, HttpStatus status) {
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, refreshCookie(result.refreshToken()).toString())
                .body(new TokenResponse(result.user(), result.accessToken()));
    }
}
