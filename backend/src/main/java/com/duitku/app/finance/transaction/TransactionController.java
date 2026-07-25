package com.duitku.app.finance.transaction;

import com.duitku.app.common.dto.PageResponse;
import com.duitku.app.finance.transaction.dto.CreateTransactionRequest;
import com.duitku.app.finance.transaction.dto.TransactionResponse;
import com.duitku.app.finance.transaction.dto.UpdateTransactionRequest;
import com.duitku.app.finance.transaction.entity.TransactionType;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public PageResponse<TransactionResponse> list(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tag,
            @PageableDefault(size = 20, sort = "occurredAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return transactionService.list(
                userId(authentication), from, to, type, accountId, categoryId, search, tag, pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public List<TransactionResponse> create(Authentication authentication, @Valid @RequestBody CreateTransactionRequest request) {
        return transactionService.create(userId(authentication), request);
    }

    @GetMapping("/{id}")
    public TransactionResponse get(Authentication authentication, @PathVariable UUID id) {
        return transactionService.get(userId(authentication), id);
    }

    @PatchMapping("/{id}")
    public TransactionResponse update(
            Authentication authentication, @PathVariable UUID id, @RequestBody UpdateTransactionRequest request) {
        return transactionService.update(userId(authentication), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable UUID id) {
        transactionService.delete(userId(authentication), id);
    }

    private UUID userId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }
}
