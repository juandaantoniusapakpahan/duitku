package com.duitku.app.dashboard.dto;

import com.duitku.app.finance.account.dto.AccountResponse;
import com.duitku.app.finance.report.dto.CategoryAmount;
import com.duitku.app.finance.transaction.dto.TransactionResponse;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(
        BigDecimal netWorth,
        BigDecimal cashTotal,
        BigDecimal investmentTotal,
        BigDecimal investmentCostTotal,
        BigDecimal investmentGainAmount,
        BigDecimal investmentGainPct,
        BigDecimal monthlyIncome,
        BigDecimal monthlyExpense,
        BigDecimal monthlySavings,
        List<TransactionResponse> recentTransactions,
        List<CategoryAmount> topCategories,
        List<AccountResponse> accounts
) {
}
