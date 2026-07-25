package com.duitku.app.finance.budget.repository;

import com.duitku.app.finance.budget.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BudgetRepository extends JpaRepository<Budget, UUID> {
    List<Budget> findByUserIdOrderByCreatedAtAsc(UUID userId);
    Optional<Budget> findByIdAndUserId(UUID id, UUID userId);
}
