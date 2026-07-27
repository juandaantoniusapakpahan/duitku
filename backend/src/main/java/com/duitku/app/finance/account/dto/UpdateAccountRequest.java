package com.duitku.app.finance.account.dto;

import com.duitku.app.finance.account.entity.AccountType;

import java.math.BigDecimal;

public record UpdateAccountRequest(
        String name,
        AccountType type,
        BigDecimal currentBalance,
        String currency,
        BigDecimal costBasis,
        BigDecimal currentValue,
        String icon,
        String color,
        String accountNumberMasked,
        BigDecimal interestRateAnnual,
        BigDecimal interestTaxRate
) {
}
