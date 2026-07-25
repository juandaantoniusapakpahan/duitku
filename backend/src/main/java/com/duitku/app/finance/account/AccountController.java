package com.duitku.app.finance.account;

import com.duitku.app.finance.account.dto.AccountResponse;
import com.duitku.app.finance.account.dto.CreateAccountRequest;
import com.duitku.app.finance.account.dto.UpdateAccountRequest;
import com.duitku.app.finance.account.entity.AccountType;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public List<AccountResponse> list(
            Authentication authentication,
            @RequestParam(required = false) AccountType type,
            @RequestParam(required = false) Boolean hidden) {
        return accountService.list(userId(authentication), type, hidden);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse create(Authentication authentication, @Valid @RequestBody CreateAccountRequest request) {
        return accountService.create(userId(authentication), request);
    }

    @GetMapping("/{id}")
    public AccountResponse get(Authentication authentication, @PathVariable UUID id) {
        return accountService.get(userId(authentication), id);
    }

    @PatchMapping("/{id}")
    public AccountResponse update(
            Authentication authentication, @PathVariable UUID id, @RequestBody UpdateAccountRequest request) {
        return accountService.update(userId(authentication), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable UUID id) {
        accountService.delete(userId(authentication), id);
    }

    @PostMapping("/{id}/hide")
    public AccountResponse toggleHidden(Authentication authentication, @PathVariable UUID id) {
        return accountService.toggleHidden(userId(authentication), id);
    }

    private UUID userId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }
}
