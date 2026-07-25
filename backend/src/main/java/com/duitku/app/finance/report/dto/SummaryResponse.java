package com.duitku.app.finance.report.dto;

import java.math.BigDecimal;

public record SummaryResponse(
        BigDecimal income,
        BigDecimal expense,
        BigDecimal savings,
        BigDecimal savingsRate,
        BigDecimal avgPerDay,
        long transactionCount
) {
}
