package com.duitku.app.finance.report;

import com.duitku.app.finance.account.entity.Account;
import com.duitku.app.finance.account.repository.AccountRepository;
import com.duitku.app.finance.category.entity.Category;
import com.duitku.app.finance.category.repository.CategoryRepository;
import com.duitku.app.finance.report.dto.*;
import com.duitku.app.finance.transaction.dto.AccountRef;
import com.duitku.app.finance.transaction.dto.CategoryRef;
import com.duitku.app.finance.transaction.entity.Transaction;
import com.duitku.app.finance.transaction.entity.TransactionType;
import com.duitku.app.finance.transaction.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ReportService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;

    public ReportService(
            TransactionRepository transactionRepository,
            AccountRepository accountRepository,
            CategoryRepository categoryRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
    }

    public SummaryResponse summary(UUID userId, Instant from, Instant to) {
        List<Transaction> txs = transactionRepository.findByUserIdAndOccurredAtBetween(userId, from, to);
        BigDecimal income = sumByType(txs, TransactionType.INCOME);
        BigDecimal expense = sumByType(txs, TransactionType.EXPENSE);
        BigDecimal savings = income.subtract(expense);
        BigDecimal savingsRate = income.compareTo(BigDecimal.ZERO) > 0
                ? savings.multiply(BigDecimal.valueOf(100)).divide(income, 1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        long days = Math.max(1, ChronoUnit.DAYS.between(from, to));
        BigDecimal avgPerDay = expense.divide(BigDecimal.valueOf(days), 0, RoundingMode.HALF_UP);
        return new SummaryResponse(income, expense, savings, savingsRate, avgPerDay, txs.size());
    }

    public List<CategoryAmount> byCategory(UUID userId, Instant from, Instant to, TransactionType kind) {
        List<Transaction> txs = transactionRepository.findByUserIdAndOccurredAtBetween(userId, from, to);
        Map<UUID, BigDecimal> amounts = new LinkedHashMap<>();
        for (Transaction tx : txs) {
            if (tx.getType() == kind && tx.getCategoryId() != null) {
                amounts.merge(tx.getCategoryId(), tx.getAmount(), BigDecimal::add);
            }
        }
        BigDecimal total = amounts.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<UUID, CategoryRef> refs = categoryRefs(amounts.keySet());
        return amounts.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .map(e -> new CategoryAmount(refs.get(e.getKey()), e.getValue(), pct(e.getValue(), total)))
                .toList();
    }

    public List<AccountAmount> byAccount(UUID userId, Instant from, Instant to) {
        List<Transaction> txs = transactionRepository.findByUserIdAndOccurredAtBetween(userId, from, to);
        Map<UUID, BigDecimal> amounts = new LinkedHashMap<>();
        for (Transaction tx : txs) {
            if (tx.getType() == TransactionType.EXPENSE && tx.getAccountId() != null) {
                amounts.merge(tx.getAccountId(), tx.getAmount(), BigDecimal::add);
            }
        }
        BigDecimal total = amounts.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<UUID, AccountRef> refs = accountRefs(amounts.keySet());
        return amounts.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .map(e -> new AccountAmount(refs.get(e.getKey()), e.getValue(), pct(e.getValue(), total)))
                .toList();
    }

    public List<MerchantAmount> topMerchants(UUID userId, Instant from, Instant to, int limit) {
        List<Transaction> txs = transactionRepository.findByUserIdAndOccurredAtBetween(userId, from, to);
        Map<String, BigDecimal> amounts = new LinkedHashMap<>();
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Transaction tx : txs) {
            if (tx.getType() == TransactionType.EXPENSE && tx.getDescription() != null && !tx.getDescription().isBlank()) {
                amounts.merge(tx.getDescription(), tx.getAmount(), BigDecimal::add);
                counts.merge(tx.getDescription(), 1L, Long::sum);
            }
        }
        return amounts.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(limit)
                .map(e -> new MerchantAmount(e.getKey(), e.getValue(), counts.get(e.getKey())))
                .toList();
    }

    public List<CashflowPoint> cashflowTrend(UUID userId, int months) {
        List<CashflowPoint> points = new ArrayList<>();
        YearMonth current = YearMonth.now(ZoneOffset.UTC);
        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            Instant from = ym.atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
            Instant to = ym.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneOffset.UTC).toInstant();
            List<Transaction> txs = transactionRepository.findByUserIdAndOccurredAtBetween(userId, from, to);
            BigDecimal income = sumByType(txs, TransactionType.INCOME);
            BigDecimal expense = sumByType(txs, TransactionType.EXPENSE);
            String label = ym.getMonth().getDisplayName(TextStyle.SHORT, new Locale("id", "ID"));
            points.add(new CashflowPoint(label, income, expense, income.subtract(expense)));
        }
        return points;
    }

    public List<CategoryComparison> comparison(UUID userId, Instant from, Instant to, Instant compareFrom, Instant compareTo) {
        List<CategoryAmount> current = byCategory(userId, from, to, TransactionType.EXPENSE);
        List<CategoryAmount> previous = byCategory(userId, compareFrom, compareTo, TransactionType.EXPENSE);
        Map<UUID, BigDecimal> prevMap = new HashMap<>();
        for (CategoryAmount ca : previous) {
            if (ca.category() != null) prevMap.put(ca.category().id(), ca.amount());
        }
        return current.stream()
                .filter(ca -> ca.category() != null)
                .map(ca -> {
                    BigDecimal prevAmount = prevMap.getOrDefault(ca.category().id(), BigDecimal.ZERO);
                    BigDecimal changePct = prevAmount.compareTo(BigDecimal.ZERO) > 0
                            ? ca.amount().subtract(prevAmount).multiply(BigDecimal.valueOf(100)).divide(prevAmount, 1, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                    return new CategoryComparison(ca.category(), ca.amount(), prevAmount, changePct);
                })
                .toList();
    }

    public List<InsightResponse> insights(UUID userId) {
        List<InsightResponse> result = new ArrayList<>();
        Instant now = Instant.now();
        YearMonth currentMonth = YearMonth.now(ZoneOffset.UTC);
        Instant monthStart = currentMonth.atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant prevMonthStart = currentMonth.minusMonths(1).atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant prevMonthEnd = monthStart;

        SummaryResponse thisMonth = summary(userId, monthStart, now);
        if (thisMonth.income().compareTo(BigDecimal.ZERO) > 0) {
            if (thisMonth.savingsRate().compareTo(BigDecimal.valueOf(25)) >= 0) {
                result.add(new InsightResponse("savings_rate", "Savings rate bagus",
                        "Savings rate kamu bulan ini " + thisMonth.savingsRate() + "%, di atas target 25%. Pertahankan!",
                        "positive"));
            } else {
                result.add(new InsightResponse("savings_rate", "Savings rate di bawah target",
                        "Savings rate kamu bulan ini " + thisMonth.savingsRate()
                                + "%, di bawah target 25%. Coba kurangi pengeluaran non-esensial.",
                        "warning"));
            }
        }

        for (CategoryComparison c : comparison(userId, monthStart, now, prevMonthStart, prevMonthEnd)) {
            if (c.category() != null && c.changePct().compareTo(BigDecimal.valueOf(20)) > 0) {
                result.add(new InsightResponse("category_spike", "Pengeluaran " + c.category().name() + " naik",
                        "Pengeluaran kategori " + c.category().name() + " naik " + c.changePct()
                                + "% dibanding bulan lalu.",
                        "warning"));
            }
        }

        List<Transaction> monthTx = transactionRepository.findByUserIdAndOccurredAtBetween(userId, monthStart, now);
        BigDecimal totalFee = monthTx.stream()
                .filter(t -> t.getParentTransactionId() != null)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalFee.compareTo(BigDecimal.valueOf(20000)) > 0) {
            result.add(new InsightResponse("bank_fee", "Fee bank lumayan besar",
                    "Total fee transfer bulan ini Rp " + totalFee.toBigInteger()
                            + ". Pertimbangkan pakai BI-Fast biar lebih hemat.",
                    "warning"));
        }

        return result;
    }

    private Map<UUID, CategoryRef> categoryRefs(Set<UUID> ids) {
        Map<UUID, CategoryRef> map = new HashMap<>();
        for (Category c : categoryRepository.findAllById(ids)) {
            map.put(c.getId(), new CategoryRef(c.getId(), c.getName(), c.getIcon(), c.getColor()));
        }
        return map;
    }

    private Map<UUID, AccountRef> accountRefs(Set<UUID> ids) {
        Map<UUID, AccountRef> map = new HashMap<>();
        for (Account a : accountRepository.findAllById(ids)) {
            map.put(a.getId(), new AccountRef(a.getId(), a.getName(), a.getIcon(), a.getColor()));
        }
        return map;
    }

    private static BigDecimal sumByType(List<Transaction> txs, TransactionType type) {
        return txs.stream().filter(t -> t.getType() == type).map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal pct(BigDecimal amount, BigDecimal total) {
        return total.compareTo(BigDecimal.ZERO) > 0
                ? amount.multiply(BigDecimal.valueOf(100)).divide(total, 1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
    }
}
