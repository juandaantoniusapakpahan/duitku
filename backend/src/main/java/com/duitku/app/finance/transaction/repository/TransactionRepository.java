package com.duitku.app.finance.transaction.repository;

import com.duitku.app.finance.transaction.entity.Transaction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {
    Optional<Transaction> findByIdAndUserId(UUID id, UUID userId);
    List<Transaction> findByParentTransactionId(UUID parentTransactionId);
    List<Transaction> findByUserIdOrderByOccurredAtDesc(UUID userId, Pageable pageable);
    List<Transaction> findByUserIdAndOccurredAtBetween(UUID userId, Instant from, Instant to);
}
