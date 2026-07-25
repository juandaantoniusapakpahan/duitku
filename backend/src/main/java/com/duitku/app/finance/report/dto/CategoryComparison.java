package com.duitku.app.finance.report.dto;

import com.duitku.app.finance.transaction.dto.CategoryRef;

import java.math.BigDecimal;

public record CategoryComparison(CategoryRef category, BigDecimal current, BigDecimal previous, BigDecimal changePct) {
}
