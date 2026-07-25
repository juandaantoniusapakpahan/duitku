package com.duitku.app.auth.dto;

public record AuthResult(UserResponse user, String accessToken, String refreshToken) {
}
