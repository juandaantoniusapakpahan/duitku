package com.duitku.app.finance.category.dto;

import java.util.UUID;

public record UpdateCategoryRequest(
        String name,
        String icon,
        String color,
        UUID parentId
) {
}
