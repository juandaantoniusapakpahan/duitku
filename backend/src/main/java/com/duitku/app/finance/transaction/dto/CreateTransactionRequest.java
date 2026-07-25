package com.duitku.app.finance.transaction.dto;

import com.duitku.app.finance.transaction.entity.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CreateTransactionRequest(
        @NotNull TransactionType type,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        Instant occurredAt,
        String description,
        String notes,
        UUID accountId,
        UUID fromAccountId,
        UUID toAccountId,
        UUID categoryId,
        BigDecimal fee,
        UUID feeCategoryId,
        List<String> tags,
        Boolean isRecurring,
        String recurrenceRule
) {
}
