package com.duitku.app.auth.dto;

import com.duitku.app.auth.entity.User;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String fullName,
        boolean emailVerified,
        Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(), user.getEmail(), user.getFullName(),
                user.isEmailVerified(), user.getCreatedAt());
    }
}
