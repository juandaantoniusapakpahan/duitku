package com.duitku.app.finance.category.repository;

import com.duitku.app.finance.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByUserIdOrderByCreatedAtAsc(UUID userId);
    Optional<Category> findByIdAndUserId(UUID id, UUID userId);
}
