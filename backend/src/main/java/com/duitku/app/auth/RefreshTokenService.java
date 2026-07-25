package com.duitku.app.auth;

import com.duitku.app.auth.entity.RefreshToken;
import com.duitku.app.auth.repository.RefreshTokenRepository;
import com.duitku.app.common.exception.InvalidRefreshTokenException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository repository;
    private final long refreshTokenTtlDays;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(
            RefreshTokenRepository repository,
            @Value("${duitku.jwt.refresh-token-ttl-days}") long refreshTokenTtlDays) {
        this.repository = repository;
        this.refreshTokenTtlDays = refreshTokenTtlDays;
    }

    public String issue(UUID userId) {
        String rawToken = generateRawToken();
        RefreshToken entity = new RefreshToken(
                userId, hash(rawToken), Instant.now().plus(Duration.ofDays(refreshTokenTtlDays)));
        repository.save(entity);
        return rawToken;
    }

    public UUID resolveUserId(String rawToken) {
        RefreshToken stored = repository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new InvalidRefreshTokenException("Refresh token not recognized"));
        if (!stored.isValid()) {
            throw new InvalidRefreshTokenException("Refresh token expired or revoked");
        }
        return stored.getUserId();
    }

    public String rotate(String rawToken) {
        RefreshToken stored = repository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new InvalidRefreshTokenException("Refresh token not recognized"));
        if (!stored.isValid()) {
            throw new InvalidRefreshTokenException("Refresh token expired or revoked");
        }
        stored.revoke();
        repository.save(stored);
        return issue(stored.getUserId());
    }

    public void revoke(String rawToken) {
        repository.findByTokenHash(hash(rawToken)).ifPresent(stored -> {
            stored.revoke();
            repository.save(stored);
        });
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
