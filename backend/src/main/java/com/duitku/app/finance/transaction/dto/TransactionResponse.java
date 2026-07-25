package com.duitku.app.finance.transaction.dto;

import com.duitku.app.finance.transaction.entity.TransactionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TransactionResponse(
        UUID id,
        TransactionType type,
        BigDecimal amount,
        Instant occurredAt,
        String description,
        String notes,
        AccountRef account,
        AccountRef fromAccount,
        AccountRef toAccount,
        CategoryRef category,
        BigDecimal fee,
        CategoryRef feeCategory,
        List<String> tags,
        boolean isRecurring,
        String recurrenceRule,
        UUID parentTransactionId,
        Instant createdAt
) {
}
