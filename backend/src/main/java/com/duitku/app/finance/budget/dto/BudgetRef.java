package com.duitku.app.finance.budget.dto;

import com.duitku.app.finance.budget.entity.BudgetPeriod;
import com.duitku.app.finance.transaction.dto.CategoryRef;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record BudgetRef(
        UUID id,
        CategoryRef category,
        BudgetPeriod period,
        BigDecimal amount,
        LocalDate startDate,
        LocalDate endDate
) {
}
