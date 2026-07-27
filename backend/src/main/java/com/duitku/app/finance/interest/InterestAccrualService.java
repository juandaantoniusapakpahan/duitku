package com.duitku.app.finance.interest;

import com.duitku.app.finance.account.AccountService;
import com.duitku.app.finance.account.entity.Account;
import com.duitku.app.finance.account.entity.AccountType;
import com.duitku.app.finance.account.repository.AccountRepository;
import com.duitku.app.finance.category.CategoryService;
import com.duitku.app.finance.category.entity.Category;
import com.duitku.app.finance.category.entity.CategoryKind;
import com.duitku.app.finance.transaction.entity.Transaction;
import com.duitku.app.finance.transaction.entity.TransactionType;
import com.duitku.app.finance.transaction.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Service
public class InterestAccrualService {

    private static final Logger log = LoggerFactory.getLogger(InterestAccrualService.class);
    private static final BigDecimal TAX_THRESHOLD = new BigDecimal("7500000");
    private static final BigDecimal DAYS_IN_YEAR = new BigDecimal("365");
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final AccountRepository accountRepository;
    private final AccountService accountService;
    private final CategoryService categoryService;
    private final TransactionRepository transactionRepository;

    public InterestAccrualService(
            AccountRepository accountRepository,
            AccountService accountService,
            CategoryService categoryService,
            TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.accountService = accountService;
        this.categoryService = categoryService;
        this.transactionRepository = transactionRepository;
    }

    @Scheduled(cron = "0 5 0 * * *", zone = "Asia/Jakarta")
    public void accrueDailyInterest() {
        List<Account> accounts = accountRepository.findByTypeAndDeletedFalseAndInterestRateAnnualGreaterThan(
                AccountType.BANK, BigDecimal.ZERO);
        log.info("Interest accrual: processing {} bank account(s) with interest enabled", accounts.size());
        for (Account account : accounts) {
            try {
                accrueForAccount(account);
            } catch (Exception e) {
                log.error("Interest accrual failed for account {}: {}", account.getId(), e.getMessage(), e);
            }
        }
    }

    @Transactional
    void accrueForAccount(Account account) {
        BigDecimal previousEndBalance = account.getCurrentBalance();
        if (previousEndBalance == null || previousEndBalance.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        Instant now = Instant.now();
        if (alreadyAccruedToday(account, now)) {
            return;
        }

        BigDecimal rate = account.getInterestRateAnnual();
        BigDecimal dailyInterest = previousEndBalance
                .multiply(rate, MathContext.DECIMAL64)
                .divide(HUNDRED, MathContext.DECIMAL64)
                .divide(DAYS_IN_YEAR, MathContext.DECIMAL64)
                .setScale(0, RoundingMode.HALF_UP);

        if (dailyInterest.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        Category bungaCategory = categoryService.getOrCreateSystemCategory(
                account.getUserId(), "Bunga Bank", CategoryKind.INCOME, "banknote", "emerald");

        Transaction interestTx = new Transaction(account.getUserId(), TransactionType.INCOME, dailyInterest, now);
        interestTx.setDescription("Bunga harian - " + account.getName());
        interestTx.setAccountId(account.getId());
        interestTx.setCategoryId(bungaCategory.getId());
        transactionRepository.save(interestTx);
        accountService.adjustBalance(account.getUserId(), account.getId(), dailyInterest);

        BigDecimal taxRate = account.getInterestTaxRate();
        boolean taxable = previousEndBalance.compareTo(TAX_THRESHOLD) > 0
                && taxRate != null && taxRate.compareTo(BigDecimal.ZERO) > 0;
        if (taxable) {
            BigDecimal tax = dailyInterest
                    .multiply(taxRate, MathContext.DECIMAL64)
                    .divide(HUNDRED, MathContext.DECIMAL64)
                    .setScale(0, RoundingMode.HALF_UP);
            if (tax.compareTo(BigDecimal.ZERO) > 0) {
                Category pajakCategory = categoryService.getOrCreateSystemCategory(
                        account.getUserId(), "Pajak Bunga", CategoryKind.EXPENSE, "receipt", "rose");
                Transaction taxTx = new Transaction(account.getUserId(), TransactionType.EXPENSE, tax, now);
                taxTx.setDescription("Pajak bunga harian - " + account.getName());
                taxTx.setAccountId(account.getId());
                taxTx.setCategoryId(pajakCategory.getId());
                transactionRepository.save(taxTx);
                accountService.adjustBalance(account.getUserId(), account.getId(), tax.negate());
            }
        }
    }

    private boolean alreadyAccruedToday(Account account, Instant now) {
        ZonedDateTime zonedNow = now.atZone(ZoneId.of("Asia/Jakarta"));
        Instant startOfDay = zonedNow.toLocalDate().atStartOfDay(ZoneId.of("Asia/Jakarta")).toInstant();
        Instant endOfDay = zonedNow.toLocalDate().plusDays(1).atStartOfDay(ZoneId.of("Asia/Jakarta")).toInstant();
        return transactionRepository.findByUserIdAndOccurredAtBetween(account.getUserId(), startOfDay, endOfDay)
                .stream()
                .anyMatch(tx -> account.getId().equals(tx.getAccountId())
                        && "Bunga harian - ".concat(account.getName()).equals(tx.getDescription()));
    }
}
