package com.duitku.app.finance.budget.dto;

import com.duitku.app.finance.budget.entity.BudgetPeriod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateBudgetRequest(
        @NotNull UUID categoryId,
        @NotNull BudgetPeriod period,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        LocalDate startDate,
        LocalDate endDate
) {
}
