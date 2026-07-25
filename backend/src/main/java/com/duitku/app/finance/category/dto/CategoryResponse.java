package com.duitku.app.finance.category.dto;

import com.duitku.app.finance.category.entity.Category;
import com.duitku.app.finance.category.entity.CategoryKind;

import java.util.UUID;

public record CategoryResponse(
        UUID id,
        String name,
        CategoryKind kind,
        String icon,
        String color,
        UUID parentId,
        boolean isDefault
) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.getId(), category.getName(), category.getKind(),
                category.getIcon(), category.getColor(), category.getParentId(), category.isDefault());
    }
}
