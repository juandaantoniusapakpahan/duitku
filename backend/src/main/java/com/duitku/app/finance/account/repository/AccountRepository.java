package com.duitku.app.finance.account.repository;

import com.duitku.app.finance.account.entity.Account;
import com.duitku.app.finance.account.entity.AccountType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {
    List<Account> findByUserIdAndDeletedFalseOrderByCreatedAtAsc(UUID userId);
    Optional<Account> findByIdAndUserIdAndDeletedFalse(UUID id, UUID userId);
    List<Account> findByTypeAndDeletedFalseAndInterestRateAnnualGreaterThan(AccountType type, BigDecimal rate);
}
