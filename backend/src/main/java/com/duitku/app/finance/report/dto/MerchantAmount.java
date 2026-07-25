package com.duitku.app.finance.report.dto;

import java.math.BigDecimal;

public record MerchantAmount(String name, BigDecimal amount, long count) {
}
