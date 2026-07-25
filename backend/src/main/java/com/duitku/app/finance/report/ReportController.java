package com.duitku.app.finance.report;

import com.duitku.app.finance.report.dto.*;
import com.duitku.app.finance.transaction.entity.TransactionType;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    public SummaryResponse summary(
            Authentication authentication,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return reportService.summary(userId(authentication), from, to);
    }

    @GetMapping("/comparison")
    public List<CategoryComparison> comparison(
            Authentication authentication,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam("compare_from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant compareFrom,
            @RequestParam("compare_to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant compareTo) {
        return reportService.comparison(userId(authentication), from, to, compareFrom, compareTo);
    }

    @GetMapping("/by-category")
    public List<CategoryAmount> byCategory(
            Authentication authentication,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "EXPENSE") TransactionType kind) {
        return reportService.byCategory(userId(authentication), from, to, kind);
    }

    @GetMapping("/by-account")
    public List<AccountAmount> byAccount(
            Authentication authentication,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return reportService.byAccount(userId(authentication), from, to);
    }

    @GetMapping("/top-merchants")
    public List<MerchantAmount> topMerchants(
            Authentication authentication,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "10") int limit) {
        return reportService.topMerchants(userId(authentication), from, to, limit);
    }

    @GetMapping("/cashflow-trend")
    public List<CashflowPoint> cashflowTrend(
            Authentication authentication,
            @RequestParam(defaultValue = "6") int months) {
        return reportService.cashflowTrend(userId(authentication), months);
    }

    @GetMapping("/insights")
    public List<InsightResponse> insights(Authentication authentication) {
        return reportService.insights(userId(authentication));
    }

    private UUID userId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }
}
