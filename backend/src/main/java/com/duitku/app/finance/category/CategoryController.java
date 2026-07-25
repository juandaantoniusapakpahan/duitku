package com.duitku.app.finance.category;

import com.duitku.app.finance.category.dto.CategoryResponse;
import com.duitku.app.finance.category.dto.CreateCategoryRequest;
import com.duitku.app.finance.category.dto.UpdateCategoryRequest;
import com.duitku.app.finance.category.entity.CategoryKind;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<CategoryResponse> list(Authentication authentication, @RequestParam(required = false) CategoryKind kind) {
        return categoryService.list(userId(authentication), kind);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(Authentication authentication, @Valid @RequestBody CreateCategoryRequest request) {
        return categoryService.create(userId(authentication), request);
    }

    @PatchMapping("/{id}")
    public CategoryResponse update(
            Authentication authentication, @PathVariable UUID id, @RequestBody UpdateCategoryRequest request) {
        return categoryService.update(userId(authentication), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable UUID id) {
        categoryService.delete(userId(authentication), id);
    }

    private UUID userId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }
}
