package com.duitku.app.finance.category;

import com.duitku.app.common.exception.CannotDeleteDefaultCategoryException;
import com.duitku.app.common.exception.ResourceNotFoundException;
import com.duitku.app.finance.category.dto.CategoryResponse;
import com.duitku.app.finance.category.dto.CreateCategoryRequest;
import com.duitku.app.finance.category.dto.UpdateCategoryRequest;
import com.duitku.app.finance.category.entity.Category;
import com.duitku.app.finance.category.entity.CategoryKind;
import com.duitku.app.finance.category.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class CategoryService {

    private record DefaultCategory(String name, CategoryKind kind, String icon, String color) {
    }

    private static final List<DefaultCategory> DEFAULT_CATEGORIES = List.of(
            new DefaultCategory("Makanan", CategoryKind.EXPENSE, "utensils", "orange"),
            new DefaultCategory("Transport", CategoryKind.EXPENSE, "car", "brand"),
            new DefaultCategory("Belanja", CategoryKind.EXPENSE, "shopping-bag", "emerald"),
            new DefaultCategory("Hiburan", CategoryKind.EXPENSE, "film", "pink"),
            new DefaultCategory("Tagihan", CategoryKind.EXPENSE, "receipt", "rose"),
            new DefaultCategory("Kesehatan", CategoryKind.EXPENSE, "heart-pulse", "red"),
            new DefaultCategory("Lainnya", CategoryKind.EXPENSE, "more-horizontal", "ink"),
            new DefaultCategory("Gaji", CategoryKind.INCOME, "wallet", "emerald"),
            new DefaultCategory("Bonus", CategoryKind.INCOME, "gift", "amber"),
            new DefaultCategory("Lainnya", CategoryKind.INCOME, "more-horizontal", "ink")
    );

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public void seedDefaults(UUID userId) {
        List<Category> categories = DEFAULT_CATEGORIES.stream()
                .map(dc -> new Category(userId, dc.name(), dc.kind(), dc.icon(), dc.color(), true))
                .toList();
        categoryRepository.saveAll(categories);
    }

    public CategoryResponse get(UUID userId, UUID categoryId) {
        return CategoryResponse.from(findOwned(userId, categoryId));
    }

    public List<CategoryResponse> list(UUID userId, CategoryKind kind) {
        return categoryRepository.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .filter(category -> kind == null || category.getKind() == kind)
                .map(CategoryResponse::from)
                .toList();
    }

    public CategoryResponse create(UUID userId, CreateCategoryRequest request) {
        Category category = new Category(userId, request.name(), request.kind(), request.icon(), request.color(), false);
        category.setParentId(request.parentId());
        return CategoryResponse.from(categoryRepository.save(category));
    }

    public CategoryResponse update(UUID userId, UUID categoryId, UpdateCategoryRequest request) {
        Category category = findOwned(userId, categoryId);
        if (request.name() != null) category.setName(request.name());
        if (request.icon() != null) category.setIcon(request.icon());
        if (request.color() != null) category.setColor(request.color());
        if (request.parentId() != null) category.setParentId(request.parentId());
        return CategoryResponse.from(categoryRepository.save(category));
    }

    public void delete(UUID userId, UUID categoryId) {
        Category category = findOwned(userId, categoryId);
        if (category.isDefault()) {
            throw new CannotDeleteDefaultCategoryException("Kategori bawaan tidak bisa dihapus");
        }
        categoryRepository.delete(category);
    }

    private Category findOwned(UUID userId, UUID categoryId) {
        return categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kategori tidak ditemukan"));
    }
}
