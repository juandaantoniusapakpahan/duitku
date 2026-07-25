package com.duitku.app.auth.dto;

public record TokenResponse(UserResponse user, String accessToken) {
}
