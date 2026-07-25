package com.duitku.app.finance.category.dto;

import com.duitku.app.finance.category.entity.CategoryKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateCategoryRequest(
        @NotBlank String name,
        @NotNull CategoryKind kind,
        @NotBlank String icon,
        @NotBlank String color,
        UUID parentId
) {
}
