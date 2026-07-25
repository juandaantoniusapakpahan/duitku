package com.duitku.app.dashboard;

import com.duitku.app.dashboard.dto.DashboardResponse;
import com.duitku.app.finance.account.AccountService;
import com.duitku.app.finance.account.dto.AccountResponse;
import com.duitku.app.finance.account.entity.AccountType;
import com.duitku.app.finance.report.ReportService;
import com.duitku.app.finance.report.dto.CategoryAmount;
import com.duitku.app.finance.report.dto.SummaryResponse;
import com.duitku.app.finance.transaction.TransactionService;
import com.duitku.app.finance.transaction.dto.TransactionResponse;
import com.duitku.app.finance.transaction.entity.TransactionType;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
public class DashboardService {

    private final AccountService accountService;
    private final ReportService reportService;
    private final TransactionService transactionService;

    public DashboardService(AccountService accountService, ReportService reportService, TransactionService transactionService) {
        this.accountService = accountService;
        this.reportService = reportService;
        this.transactionService = transactionService;
    }

    public DashboardResponse get(UUID userId) {
        List<AccountResponse> accounts = accountService.list(userId, null, false);

        BigDecimal cashTotal = accounts.stream()
                .filter(a -> a.type() != AccountType.INVESTMENT)
                .map(AccountResponse::currentBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal investmentTotal = accounts.stream()
                .filter(a -> a.type() == AccountType.INVESTMENT)
                .map(a -> a.currentValue() != null ? a.currentValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal investmentCostTotal = accounts.stream()
                .filter(a -> a.type() == AccountType.INVESTMENT)
                .map(a -> a.costBasis() != null ? a.costBasis() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal investmentGainAmount = investmentTotal.subtract(investmentCostTotal);
        BigDecimal investmentGainPct = investmentCostTotal.compareTo(BigDecimal.ZERO) > 0
                ? investmentGainAmount.multiply(BigDecimal.valueOf(100)).divide(investmentCostTotal, 1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal netWorth = cashTotal.add(investmentTotal);

        YearMonth currentMonth = YearMonth.now(ZoneOffset.UTC);
        Instant monthStart = currentMonth.atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant now = Instant.now();
        SummaryResponse summary = reportService.summary(userId, monthStart, now);

        List<TransactionResponse> recent = transactionService.recent(userId, 5);
        List<CategoryAmount> topCategories = reportService.byCategory(userId, monthStart, now, TransactionType.EXPENSE)
                .stream()
                .limit(4)
                .toList();

        return new DashboardResponse(
                netWorth, cashTotal, investmentTotal, investmentCostTotal, investmentGainAmount, investmentGainPct,
                summary.income(), summary.expense(), summary.savings(), recent, topCategories, accounts);
    }
}
