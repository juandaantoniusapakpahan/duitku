package com.duitku.app.finance.budget;

import com.duitku.app.common.exception.ResourceNotFoundException;
import com.duitku.app.finance.budget.dto.BudgetProgressResponse;
import com.duitku.app.finance.budget.dto.BudgetRef;
import com.duitku.app.finance.budget.dto.CreateBudgetRequest;
import com.duitku.app.finance.budget.dto.UpdateBudgetRequest;
import com.duitku.app.finance.budget.entity.Budget;
import com.duitku.app.finance.budget.repository.BudgetRepository;
import com.duitku.app.finance.category.entity.Category;
import com.duitku.app.finance.category.repository.CategoryRepository;
import com.duitku.app.finance.transaction.dto.CategoryRef;
import com.duitku.app.finance.transaction.entity.Transaction;
import com.duitku.app.finance.transaction.entity.TransactionType;
import com.duitku.app.finance.transaction.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    public BudgetService(
            BudgetRepository budgetRepository,
            CategoryRepository categoryRepository,
            TransactionRepository transactionRepository) {
        this.budgetRepository = budgetRepository;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
    }

    public List<BudgetProgressResponse> list(UUID userId) {
        return budgetRepository.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(this::toProgress)
                .toList();
    }

    public BudgetProgressResponse create(UUID userId, CreateBudgetRequest request) {
        LocalDate startDate = request.startDate() != null ? request.startDate() : LocalDate.now(ZoneOffset.UTC);
        Budget budget = new Budget(userId, request.categoryId(), request.period(), request.amount(), startDate);
        budget.setEndDate(request.endDate());
        budgetRepository.save(budget);
        return toProgress(budget);
    }

    public BudgetProgressResponse update(UUID userId, UUID budgetId, UpdateBudgetRequest request) {
        Budget budget = findOwned(userId, budgetId);
        if (request.amount() != null) budget.setAmount(request.amount());
        if (request.endDate() != null) budget.setEndDate(request.endDate());
        budgetRepository.save(budget);
        return toProgress(budget);
    }

    public void delete(UUID userId, UUID budgetId) {
        budgetRepository.delete(findOwned(userId, budgetId));
    }

    private BudgetProgressResponse toProgress(Budget budget) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate periodStart;
        LocalDate periodEnd;
        switch (budget.getPeriod()) {
            case WEEKLY -> {
                periodStart = today.with(DayOfWeek.MONDAY);
                periodEnd = today.with(DayOfWeek.SUNDAY);
            }
            case YEARLY -> {
                periodStart = today.withDayOfYear(1);
                periodEnd = today.withDayOfYear(today.lengthOfYear());
            }
            default -> {
                periodStart = today.withDayOfMonth(1);
                periodEnd = today.withDayOfMonth(today.lengthOfMonth());
            }
        }

        Instant from = periodStart.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant to = periodEnd.atTime(23, 59, 59).atZone(ZoneOffset.UTC).toInstant();

        List<Transaction> txs = transactionRepository.findByUserIdAndOccurredAtBetween(budget.getUserId(), from, to);
        BigDecimal spent = txs.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE && budget.getCategoryId().equals(t.getCategoryId()))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal remaining = budget.getAmount().subtract(spent);
        BigDecimal pct = budget.getAmount().compareTo(BigDecimal.ZERO) > 0
                ? spent.multiply(BigDecimal.valueOf(100)).divide(budget.getAmount(), 1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        String status = pct.compareTo(BigDecimal.valueOf(100)) > 0
                ? "over"
                : pct.compareTo(BigDecimal.valueOf(75)) > 0 ? "warning" : "on_track";
        long daysRemaining = Math.max(0, ChronoUnit.DAYS.between(today, periodEnd));

        Category category = categoryRepository.findById(budget.getCategoryId()).orElse(null);
        CategoryRef categoryRef = category != null
                ? new CategoryRef(category.getId(), category.getName(), category.getIcon(), category.getColor())
                : null;

        BudgetRef budgetRef = new BudgetRef(
                budget.getId(), categoryRef, budget.getPeriod(), budget.getAmount(), budget.getStartDate(), budget.getEndDate());
        return new BudgetProgressResponse(budgetRef, spent, remaining, pct, status, daysRemaining);
    }

    private Budget findOwned(UUID userId, UUID budgetId) {
        return budgetRepository.findByIdAndUserId(budgetId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget tidak ditemukan"));
    }
}
