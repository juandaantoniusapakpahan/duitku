package com.duitku.app.finance.budget.dto;

import java.math.BigDecimal;

public record BudgetProgressResponse(
        BudgetRef budget,
        BigDecimal spent,
        BigDecimal remaining,
        BigDecimal pct,
        String status,
        long daysRemaining
) {
}
