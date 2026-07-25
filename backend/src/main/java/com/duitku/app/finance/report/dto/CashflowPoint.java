package com.duitku.app.finance.report.dto;

import java.math.BigDecimal;

public record CashflowPoint(String month, BigDecimal income, BigDecimal expense, BigDecimal savings) {
}
