package com.duitku.app.auth;

import com.duitku.app.auth.dto.AuthResult;
import com.duitku.app.auth.dto.LoginRequest;
import com.duitku.app.auth.dto.RegisterRequest;
import com.duitku.app.auth.dto.UserResponse;
import com.duitku.app.auth.entity.User;
import com.duitku.app.auth.repository.UserRepository;
import com.duitku.app.common.exception.DuplicateEmailException;
import com.duitku.app.common.exception.InvalidCredentialsException;
import com.duitku.app.common.exception.InvalidRefreshTokenException;
import com.duitku.app.common.security.JwtService;
import com.duitku.app.finance.category.CategoryService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final CategoryService categoryService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            CategoryService categoryService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.categoryService = categoryService;
    }

    public AuthResult register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateEmailException("Email sudah terdaftar");
        }
        User user = new User(request.email(), passwordEncoder.encode(request.password()), request.fullName());
        user = userRepository.save(user);
        categoryService.seedDefaults(user.getId());
        return issueTokens(user);
    }

    public AuthResult login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidCredentialsException("Email atau password salah"));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Email atau password salah");
        }
        return issueTokens(user);
    }

    public AuthResult refresh(String rawRefreshToken) {
        UUID userId = refreshTokenService.resolveUserId(rawRefreshToken);
        String newRawRefreshToken = refreshTokenService.rotate(rawRefreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidRefreshTokenException("User untuk refresh token ini tidak ditemukan"));
        String newAccessToken = jwtService.generateAccessToken(user);
        return new AuthResult(UserResponse.from(user), newAccessToken, newRawRefreshToken);
    }

    public void logout(String rawRefreshToken) {
        refreshTokenService.revoke(rawRefreshToken);
    }

    private AuthResult issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = refreshTokenService.issue(user.getId());
        return new AuthResult(UserResponse.from(user), accessToken, refreshToken);
    }
}
