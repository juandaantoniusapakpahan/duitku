package com.duitku.app.finance.report.dto;

import com.duitku.app.finance.transaction.dto.AccountRef;

import java.math.BigDecimal;

public record AccountAmount(AccountRef account, BigDecimal amount, BigDecimal pct) {
}
