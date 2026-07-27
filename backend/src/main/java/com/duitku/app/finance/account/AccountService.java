package com.duitku.app.finance.account;

import com.duitku.app.common.exception.ResourceNotFoundException;
import com.duitku.app.finance.account.dto.AccountResponse;
import com.duitku.app.finance.account.dto.CreateAccountRequest;
import com.duitku.app.finance.account.dto.UpdateAccountRequest;
import com.duitku.app.finance.account.entity.Account;
import com.duitku.app.finance.account.entity.AccountType;
import com.duitku.app.finance.account.repository.AccountRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class AccountService {

    private final AccountRepository accountRepository;

    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public List<AccountResponse> list(UUID userId, AccountType type, Boolean hidden) {
        return accountRepository.findByUserIdAndDeletedFalseOrderByCreatedAtAsc(userId).stream()
                .filter(account -> type == null || account.getType() == type)
                .filter(account -> hidden == null || account.isHidden() == hidden)
                .map(AccountResponse::from)
                .toList();
    }

    public AccountResponse get(UUID userId, UUID accountId) {
        return AccountResponse.from(findOwned(userId, accountId));
    }

    public AccountResponse create(UUID userId, CreateAccountRequest request) {
        Account account = new Account(
                userId, request.name(), request.type(),
                request.currentBalance() != null ? request.currentBalance() : BigDecimal.ZERO,
                request.icon(), request.color());
        account.setCurrency(request.currency() != null ? request.currency() : "IDR");
        account.setCostBasis(request.costBasis());
        account.setCurrentValue(request.currentValue());
        account.setAccountNumberMasked(request.accountNumberMasked());
        if (request.type() == AccountType.BANK) {
            account.setInterestRateAnnual(request.interestRateAnnual());
            account.setInterestTaxRate(request.interestTaxRate());
        }
        return AccountResponse.from(accountRepository.save(account));
    }

    public AccountResponse update(UUID userId, UUID accountId, UpdateAccountRequest request) {
        Account account = findOwned(userId, accountId);
        if (request.name() != null) account.setName(request.name());
        if (request.type() != null) account.setType(request.type());
        if (request.currentBalance() != null) account.setCurrentBalance(request.currentBalance());
        if (request.currency() != null) account.setCurrency(request.currency());
        if (request.costBasis() != null) account.setCostBasis(request.costBasis());
        if (request.currentValue() != null) account.setCurrentValue(request.currentValue());
        if (request.icon() != null) account.setIcon(request.icon());
        if (request.color() != null) account.setColor(request.color());
        if (request.accountNumberMasked() != null) account.setAccountNumberMasked(request.accountNumberMasked());
        if (account.getType() == AccountType.BANK) {
            if (request.interestRateAnnual() != null) account.setInterestRateAnnual(request.interestRateAnnual());
            if (request.interestTaxRate() != null) account.setInterestTaxRate(request.interestTaxRate());
        }
        return AccountResponse.from(accountRepository.save(account));
    }

    public void delete(UUID userId, UUID accountId) {
        Account account = findOwned(userId, accountId);
        account.markDeleted();
        accountRepository.save(account);
    }

    public AccountResponse toggleHidden(UUID userId, UUID accountId) {
        Account account = findOwned(userId, accountId);
        account.toggleHidden();
        return AccountResponse.from(accountRepository.save(account));
    }

    public void adjustBalance(UUID userId, UUID accountId, BigDecimal delta) {
        Account account = findOwned(userId, accountId);
        if (account.getType() == AccountType.INVESTMENT) {
            // Investment accounts are valued via cost_basis/current_value (shown as "Nilai saat ini"),
            // not current_balance. A transfer in/out is treated as buying/withdrawing capital at par —
            // both move together so gain/loss stays 0 until the user manually updates current_value.
            BigDecimal costBasis = account.getCostBasis() != null ? account.getCostBasis() : BigDecimal.ZERO;
            BigDecimal currentValue = account.getCurrentValue() != null ? account.getCurrentValue() : BigDecimal.ZERO;
            account.setCostBasis(costBasis.add(delta));
            account.setCurrentValue(currentValue.add(delta));
        } else {
            account.setCurrentBalance(account.getCurrentBalance().add(delta));
        }
        accountRepository.save(account);
    }

    private Account findOwned(UUID userId, UUID accountId) {
        return accountRepository.findByIdAndUserIdAndDeletedFalse(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Akun tidak ditemukan"));
    }
}
