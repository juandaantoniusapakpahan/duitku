package com.duitku.app.finance.transaction.dto;

import java.util.UUID;

public record AccountRef(UUID id, String name, String icon, String color) {
}
