package com.duitku.app.finance.transaction;

import com.duitku.app.common.dto.PageResponse;
import com.duitku.app.common.exception.InvalidTransactionException;
import com.duitku.app.common.exception.ResourceNotFoundException;
import com.duitku.app.finance.account.AccountService;
import com.duitku.app.finance.account.entity.Account;
import com.duitku.app.finance.account.repository.AccountRepository;
import com.duitku.app.finance.category.entity.Category;
import com.duitku.app.finance.category.repository.CategoryRepository;
import com.duitku.app.finance.transaction.dto.*;
import com.duitku.app.finance.transaction.entity.Transaction;
import com.duitku.app.finance.transaction.entity.TransactionType;
import com.duitku.app.finance.transaction.repository.TransactionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final AccountService accountService;

    public TransactionService(
            TransactionRepository transactionRepository,
            AccountRepository accountRepository,
            CategoryRepository categoryRepository,
            AccountService accountService) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.accountService = accountService;
    }

    public PageResponse<TransactionResponse> list(
            UUID userId, Instant from, Instant to, TransactionType type, UUID accountId,
            UUID categoryId, String search, String tag, Pageable pageable) {
        Specification<Transaction> spec = Specification
                .where(TransactionSpecifications.forUser(userId))
                .and(TransactionSpecifications.occurredFrom(from))
                .and(TransactionSpecifications.occurredTo(to))
                .and(TransactionSpecifications.hasType(type))
                .and(TransactionSpecifications.involvesAccount(accountId))
                .and(TransactionSpecifications.hasCategory(categoryId))
                .and(TransactionSpecifications.descriptionContains(search))
                .and(TransactionSpecifications.hasTag(tag));

        Page<Transaction> page = transactionRepository.findAll(spec, pageable);
        List<TransactionResponse> content = toResponses(page.getContent());
        return new PageResponse<>(content, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    public TransactionResponse get(UUID userId, UUID transactionId) {
        Transaction tx = findOwned(userId, transactionId);
        return toResponses(List.of(tx)).get(0);
    }

    public List<TransactionResponse> recent(UUID userId, int limit) {
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByOccurredAtDesc(
                userId, org.springframework.data.domain.PageRequest.of(0, limit));
        return toResponses(transactions);
    }

    @Transactional
    public List<TransactionResponse> create(UUID userId, CreateTransactionRequest request) {
        validate(request);

        Transaction main = buildMainTransaction(userId, request);
        transactionRepository.save(main);
        applyBalanceEffect(main);

        List<Transaction> created = new ArrayList<>();
        created.add(main);

        boolean hasFee = request.type() == TransactionType.TRANSFER
                && request.fee() != null && request.fee().compareTo(BigDecimal.ZERO) > 0;
        if (hasFee) {
            Transaction feeTx = buildFeeTransaction(userId, request, main);
            transactionRepository.save(feeTx);
            applyBalanceEffect(feeTx);
            created.add(feeTx);
        }

        return toResponses(created);
    }

    @Transactional
    public TransactionResponse update(UUID userId, UUID transactionId, UpdateTransactionRequest request) {
        Transaction tx = findOwned(userId, transactionId);

        boolean changesAmount = request.amount() != null && request.amount().compareTo(tx.getAmount()) != 0;
        boolean changesAccount = request.accountId() != null && !request.accountId().equals(tx.getAccountId());
        boolean balanceAffectingChange = changesAmount || changesAccount;

        if (balanceAffectingChange && tx.getType() == TransactionType.TRANSFER) {
            throw new InvalidTransactionException(
                    "Jumlah dan akun transfer tidak bisa diubah — hapus transaksinya lalu buat ulang.");
        }
        if (request.amount() != null && request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidTransactionException("Jumlah transaksi harus lebih besar dari 0");
        }

        if (balanceAffectingChange) {
            reverseBalanceEffect(tx);
        }

        if (request.description() != null) tx.setDescription(request.description());
        if (request.notes() != null) tx.setNotes(request.notes());
        if (request.occurredAt() != null) tx.setOccurredAt(request.occurredAt());
        if (request.tags() != null) tx.setTags(request.tags());
        if (request.categoryId() != null) tx.setCategoryId(request.categoryId());
        if (changesAmount) tx.setAmount(request.amount());
        if (changesAccount) {
            accountService.get(userId, request.accountId());
            tx.setAccountId(request.accountId());
        }

        transactionRepository.save(tx);

        if (balanceAffectingChange) {
            applyBalanceEffect(tx);
        }

        return toResponses(List.of(tx)).get(0);
    }

    @Transactional
    public void delete(UUID userId, UUID transactionId) {
        Transaction tx = findOwned(userId, transactionId);
        for (Transaction child : transactionRepository.findByParentTransactionId(tx.getId())) {
            reverseBalanceEffect(child);
            transactionRepository.delete(child);
        }
        reverseBalanceEffect(tx);
        transactionRepository.delete(tx);
    }

    private void validate(CreateTransactionRequest request) {
        if (request.type() == TransactionType.TRANSFER) {
            if (request.fromAccountId() == null || request.toAccountId() == null) {
                throw new InvalidTransactionException("Transfer wajib punya from_account_id dan to_account_id");
            }
        } else if (request.accountId() == null) {
            throw new InvalidTransactionException("account_id wajib diisi untuk income/expense");
        }
        if (request.fee() != null && request.fee().compareTo(BigDecimal.ZERO) > 0 && request.feeCategoryId() == null) {
            throw new InvalidTransactionException("fee_category_id wajib diisi kalau ada fee");
        }
    }

    private Transaction buildMainTransaction(UUID userId, CreateTransactionRequest request) {
        Instant occurredAt = request.occurredAt() != null ? request.occurredAt() : Instant.now();
        Transaction tx = new Transaction(userId, request.type(), request.amount(), occurredAt);
        tx.setDescription(request.description());
        tx.setNotes(request.notes());
        tx.setTags(request.tags() != null ? request.tags() : List.of());
        tx.setRecurring(Boolean.TRUE.equals(request.isRecurring()));
        tx.setRecurrenceRule(request.recurrenceRule());

        if (request.type() == TransactionType.TRANSFER) {
            accountService.get(userId, request.fromAccountId());
            accountService.get(userId, request.toAccountId());
            tx.setFromAccountId(request.fromAccountId());
            tx.setToAccountId(request.toAccountId());
            tx.setCategoryId(request.categoryId());
            if (request.fee() != null) tx.setFee(request.fee());
        } else {
            accountService.get(userId, request.accountId());
            tx.setAccountId(request.accountId());
            tx.setCategoryId(request.categoryId());
        }
        return tx;
    }

    private Transaction buildFeeTransaction(UUID userId, CreateTransactionRequest request, Transaction main) {
        Transaction feeTx = new Transaction(userId, TransactionType.EXPENSE, request.fee(), main.getOccurredAt());
        feeTx.setDescription("Fee transfer");
        feeTx.setAccountId(request.fromAccountId());
        feeTx.setCategoryId(request.feeCategoryId());
        feeTx.setParentTransactionId(main.getId());
        return feeTx;
    }

    private void applyBalanceEffect(Transaction tx) {
        switch (tx.getType()) {
            case INCOME -> accountService.adjustBalance(tx.getUserId(), tx.getAccountId(), tx.getAmount());
            case EXPENSE -> accountService.adjustBalance(tx.getUserId(), tx.getAccountId(), tx.getAmount().negate());
            case TRANSFER -> {
                accountService.adjustBalance(tx.getUserId(), tx.getFromAccountId(), tx.getAmount().negate());
                accountService.adjustBalance(tx.getUserId(), tx.getToAccountId(), tx.getAmount());
            }
        }
    }

    private void reverseBalanceEffect(Transaction tx) {
        switch (tx.getType()) {
            case INCOME -> accountService.adjustBalance(tx.getUserId(), tx.getAccountId(), tx.getAmount().negate());
            case EXPENSE -> accountService.adjustBalance(tx.getUserId(), tx.getAccountId(), tx.getAmount());
            case TRANSFER -> {
                accountService.adjustBalance(tx.getUserId(), tx.getFromAccountId(), tx.getAmount());
                accountService.adjustBalance(tx.getUserId(), tx.getToAccountId(), tx.getAmount().negate());
            }
        }
    }

    private Transaction findOwned(UUID userId, UUID transactionId) {
        return transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaksi tidak ditemukan"));
    }

    private List<TransactionResponse> toResponses(List<Transaction> transactions) {
        Set<UUID> accountIds = new HashSet<>();
        Set<UUID> categoryIds = new HashSet<>();
        for (Transaction tx : transactions) {
            if (tx.getAccountId() != null) accountIds.add(tx.getAccountId());
            if (tx.getFromAccountId() != null) accountIds.add(tx.getFromAccountId());
            if (tx.getToAccountId() != null) accountIds.add(tx.getToAccountId());
            if (tx.getCategoryId() != null) categoryIds.add(tx.getCategoryId());
            if (tx.getFeeCategoryId() != null) categoryIds.add(tx.getFeeCategoryId());
        }

        Map<UUID, AccountRef> accountRefs = new HashMap<>();
        for (Account account : accountRepository.findAllById(accountIds)) {
            accountRefs.put(account.getId(), new AccountRef(account.getId(), account.getName(), account.getIcon(), account.getColor()));
        }
        Map<UUID, CategoryRef> categoryRefs = new HashMap<>();
        for (Category category : categoryRepository.findAllById(categoryIds)) {
            categoryRefs.put(category.getId(), new CategoryRef(category.getId(), category.getName(), category.getIcon(), category.getColor()));
        }

        return transactions.stream()
                .map(tx -> new TransactionResponse(
                        tx.getId(), tx.getType(), tx.getAmount(), tx.getOccurredAt(), tx.getDescription(), tx.getNotes(),
                        accountRefs.get(tx.getAccountId()), accountRefs.get(tx.getFromAccountId()), accountRefs.get(tx.getToAccountId()),
                        categoryRefs.get(tx.getCategoryId()), tx.getFee(), categoryRefs.get(tx.getFeeCategoryId()),
                        tx.getTags(), tx.isRecurring(), tx.getRecurrenceRule(), tx.getParentTransactionId(), tx.getCreatedAt()))
                .toList();
    }
}
