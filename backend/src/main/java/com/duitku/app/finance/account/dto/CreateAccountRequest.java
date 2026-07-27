package com.duitku.app.finance.account.dto;

import com.duitku.app.finance.account.entity.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateAccountRequest(
        @NotBlank String name,
        @NotNull AccountType type,
        BigDecimal currentBalance,
        String currency,
        BigDecimal costBasis,
        BigDecimal currentValue,
        @NotBlank String icon,
        @NotBlank String color,
        String accountNumberMasked,
        BigDecimal interestRateAnnual,
        BigDecimal interestTaxRate
) {
}
