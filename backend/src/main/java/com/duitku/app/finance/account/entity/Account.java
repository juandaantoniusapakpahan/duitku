package com.duitku.app.finance.account.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "accounts")
public class Account {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountType type;

    @Column(name = "current_balance", nullable = false)
    private BigDecimal currentBalance = BigDecimal.ZERO;

    @Column(nullable = false)
    private String currency = "IDR";

    @Column(name = "cost_basis")
    private BigDecimal costBasis;

    @Column(name = "current_value")
    private BigDecimal currentValue;

    @Column(nullable = false)
    private String icon;

    @Column(nullable = false)
    private String color;

    @Column(name = "account_number_masked")
    private String accountNumberMasked;

    @Column(name = "interest_rate_annual")
    private BigDecimal interestRateAnnual;

    @Column(name = "interest_tax_rate")
    private BigDecimal interestTaxRate;

    @Column(name = "is_hidden", nullable = false)
    private boolean hidden = false;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Account() {
    }

    public Account(UUID userId, String name, AccountType type, BigDecimal currentBalance, String icon, String color) {
        this.userId = userId;
        this.name = name;
        this.type = type;
        this.currentBalance = currentBalance;
        this.icon = icon;
        this.color = color;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void markDeleted() {
        this.deleted = true;
    }

    public void toggleHidden() {
        this.hidden = !this.hidden;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public AccountType getType() { return type; }
    public void setType(AccountType type) { this.type = type; }
    public BigDecimal getCurrentBalance() { return currentBalance; }
    public void setCurrentBalance(BigDecimal currentBalance) { this.currentBalance = currentBalance; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public BigDecimal getCostBasis() { return costBasis; }
    public void setCostBasis(BigDecimal costBasis) { this.costBasis = costBasis; }
    public BigDecimal getCurrentValue() { return currentValue; }
    public void setCurrentValue(BigDecimal currentValue) { this.currentValue = currentValue; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getAccountNumberMasked() { return accountNumberMasked; }
    public void setAccountNumberMasked(String accountNumberMasked) { this.accountNumberMasked = accountNumberMasked; }
    public BigDecimal getInterestRateAnnual() { return interestRateAnnual; }
    public void setInterestRateAnnual(BigDecimal interestRateAnnual) { this.interestRateAnnual = interestRateAnnual; }
    public BigDecimal getInterestTaxRate() { return interestTaxRate; }
    public void setInterestTaxRate(BigDecimal interestTaxRate) { this.interestTaxRate = interestTaxRate; }
    public boolean isHidden() { return hidden; }
    public boolean isDeleted() { return deleted; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
