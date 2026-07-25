package com.duitku.app.finance.transaction.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UpdateTransactionRequest(
        String description,
        String notes,
        Instant occurredAt,
        List<String> tags,
        BigDecimal amount,
        UUID accountId,
        UUID categoryId
) {
}
