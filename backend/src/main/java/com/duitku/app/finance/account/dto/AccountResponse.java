package com.duitku.app.finance.account.dto;

import com.duitku.app.finance.account.entity.Account;
import com.duitku.app.finance.account.entity.AccountType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AccountResponse(
        UUID id,
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
        BigDecimal interestTaxRate,
        boolean hidden,
        Instant createdAt,
        Instant updatedAt
) {
    public static AccountResponse from(Account account) {
        return new AccountResponse(
                account.getId(), account.getName(), account.getType(),
                account.getCurrentBalance(), account.getCurrency(),
                account.getCostBasis(), account.getCurrentValue(),
                account.getIcon(), account.getColor(), account.getAccountNumberMasked(),
                account.getInterestRateAnnual(), account.getInterestTaxRate(),
                account.isHidden(), account.getCreatedAt(), account.getUpdatedAt());
    }
}
