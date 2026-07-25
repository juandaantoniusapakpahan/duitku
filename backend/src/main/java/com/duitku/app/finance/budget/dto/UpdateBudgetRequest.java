package com.duitku.app.finance.budget.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateBudgetRequest(BigDecimal amount, LocalDate endDate) {
}
