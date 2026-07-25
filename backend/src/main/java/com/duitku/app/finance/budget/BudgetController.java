package com.duitku.app.finance.budget;

import com.duitku.app.finance.budget.dto.BudgetProgressResponse;
import com.duitku.app.finance.budget.dto.CreateBudgetRequest;
import com.duitku.app.finance.budget.dto.UpdateBudgetRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public List<BudgetProgressResponse> list(Authentication authentication) {
        return budgetService.list(userId(authentication));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BudgetProgressResponse create(Authentication authentication, @Valid @RequestBody CreateBudgetRequest request) {
        return budgetService.create(userId(authentication), request);
    }

    @PatchMapping("/{id}")
    public BudgetProgressResponse update(
            Authentication authentication, @PathVariable UUID id, @RequestBody UpdateBudgetRequest request) {
        return budgetService.update(userId(authentication), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable UUID id) {
        budgetService.delete(userId(authentication), id);
    }

    private UUID userId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }
}
