package com.duitku.app.finance.transaction;

import com.duitku.app.finance.transaction.entity.Transaction;
import com.duitku.app.finance.transaction.entity.TransactionType;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.UUID;

final class TransactionSpecifications {

    private TransactionSpecifications() {
    }

    static Specification<Transaction> forUser(UUID userId) {
        return (root, query, cb) -> cb.equal(root.get("userId"), userId);
    }

    static Specification<Transaction> occurredFrom(Instant from) {
        return (root, query, cb) -> from == null ? null : cb.greaterThanOrEqualTo(root.get("occurredAt"), from);
    }

    static Specification<Transaction> occurredTo(Instant to) {
        return (root, query, cb) -> to == null ? null : cb.lessThanOrEqualTo(root.get("occurredAt"), to);
    }

    static Specification<Transaction> hasType(TransactionType type) {
        return (root, query, cb) -> type == null ? null : cb.equal(root.get("type"), type);
    }

    static Specification<Transaction> involvesAccount(UUID accountId) {
        return (root, query, cb) -> accountId == null ? null : cb.or(
                cb.equal(root.get("accountId"), accountId),
                cb.equal(root.get("fromAccountId"), accountId),
                cb.equal(root.get("toAccountId"), accountId));
    }

    static Specification<Transaction> hasCategory(UUID categoryId) {
        return (root, query, cb) -> categoryId == null ? null : cb.equal(root.get("categoryId"), categoryId);
    }

    static Specification<Transaction> descriptionContains(String search) {
        return (root, query, cb) -> (search == null || search.isBlank())
                ? null
                : cb.like(cb.lower(root.get("description")), "%" + search.toLowerCase() + "%");
    }

    static Specification<Transaction> hasTag(String tag) {
        return (root, query, cb) -> (tag == null || tag.isBlank())
                ? null
                : cb.isNotNull(cb.function("array_position", Integer.class, root.get("tags"), cb.literal(tag)));
    }
}
