# Duitku — Tahap 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Working register/login/refresh/me auth flow — Spring Boot backend + React frontend — with the Login/Register UI pixel-identical to `docs/duitku-dashboard.html`.

**Architecture:** Spring Boot 3 (Java 21, Maven) REST API under `/api/v1`, stateless JWT auth (15m access token in response body, 7d opaque refresh token in an httpOnly cookie, hashed at rest), Postgres 16 via Docker + Flyway migrations. React 18 + Vite + TS frontend, Tailwind config cloned from the mockup, Zustand for in-memory auth state, TanStack Query for data fetching, axios with a refresh-on-401 interceptor.

**Tech Stack:** Spring Boot 3.3.x, Spring Security, Spring Data JPA, Flyway, jjwt 0.12.x, SpringDoc OpenAPI, JUnit 5 + Mockito + Testcontainers (Postgres) · React 18, Vite, TypeScript, Tailwind CSS 3, Zustand, TanStack Query v5, React Hook Form + Zod, React Router v6, axios, lucide-react, Vitest.

Design doc: [docs/superpowers/specs/2026-07-25-duitku-tahap1-foundation-design.md](../specs/2026-07-25-duitku-tahap1-foundation-design.md)
Parent spec: [docs/prompt-duitku-fullstack.md](../../prompt-duitku-fullstack.md)
Mockup: [docs/duitku-dashboard.html](../../duitku-dashboard.html)

## Global Constraints

- Backend: Spring Boot 3.x, Java 21, Maven build, PostgreSQL 16 (Docker locally).
- ORM: Spring Data JPA + Hibernate. Migrations: Flyway.
- Auth: Spring Security + JWT — access token 15 minutes, refresh token 7 days — passwords hashed with BCrypt.
- API: REST, JSON, all endpoints versioned under `/api/v1/...`.
- Docs: SpringDoc OpenAPI (Swagger UI) at `/swagger-ui.html`.
- Testing: JUnit 5 + Mockito for units, Testcontainers (Postgres) for integration tests.
- Logging: SLF4J + Logback with JSON encoder.
- Every user-data query MUST filter by `user_id` from the JWT — row-level isolation lives in the service layer, never trusted from the client.
- Frontend: React 18 + Vite + TypeScript, Tailwind CSS 3 with the mockup's exact `brand`/`ink` palette and Inter font — no Material UI / Chakra / Ant Design.
- State: Zustand. Data fetching: TanStack Query v5. Forms: React Hook Form + Zod. Router: React Router v6. HTTP: axios with a JWT interceptor + auto-refresh on 401. Icons: `lucide-react`, same icon names as the mockup.
- UI fidelity over speed — the Login/Register pages must match the mockup's className, layout, spacing, color, and animation exactly.
- Currency formatting helper (`formatIDR`) is a later-phase concern (accounts/transactions) — not exercised in Tahap 1, but keep the helper name reserved for Tahap 2.

## File Structure

```
backend/
├── pom.xml
├── src/main/java/com/duitku/app/
│   ├── DuitkuApplication.java
│   ├── common/
│   │   ├── config/SecurityConfig.java
│   │   ├── config/OpenApiConfig.java
│   │   ├── exception/ApiException.java
│   │   ├── exception/DuplicateEmailException.java
│   │   ├── exception/InvalidCredentialsException.java
│   │   ├── exception/InvalidRefreshTokenException.java
│   │   ├── exception/GlobalExceptionHandler.java
│   │   ├── security/JwtService.java
│   │   ├── security/JwtAuthenticationFilter.java
│   │   └── dto/ErrorResponse.java
│   └── auth/
│       ├── AuthController.java
│       ├── AuthService.java
│       ├── RefreshTokenService.java
│       ├── entity/User.java
│       ├── entity/RefreshToken.java
│       ├── repository/UserRepository.java
│       ├── repository/RefreshTokenRepository.java
│       └── dto/{RegisterRequest,LoginRequest,UserResponse,TokenResponse}.java
├── src/main/resources/application.yml, application-dev.yml, application-prod.yml, logback-spring.xml
├── src/main/resources/db/migration/V1__users.sql, V2__refresh_tokens.sql
└── src/test/java/com/duitku/app/... (unit tests mirror main tree + AuthIntegrationTest.java)

frontend/
├── package.json, vite.config.ts, tailwind.config.js, postcss.config.js, tsconfig.json, index.html, .env.example
├── src/main.tsx, App.tsx
├── src/styles/index.css
├── src/lib/api.ts, src/lib/auth.ts, src/lib/passwordStrength.ts
├── src/features/auth/LoginPage.tsx, RegisterPage.tsx, useAuth.ts
├── src/routes/ProtectedRoute.tsx
└── src/pages/DashboardPlaceholder.tsx

docker-compose.yml (repo root)
```

---

### Task 1: Backend project scaffold, Postgres via Docker, Flyway migrations

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/java/com/duitku/app/DuitkuApplication.java`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/resources/application-dev.yml`
- Create: `backend/src/main/resources/application-prod.yml`
- Create: `backend/src/main/resources/logback-spring.xml`
- Create: `backend/src/main/resources/db/migration/V1__users.sql`
- Create: `backend/src/main/resources/db/migration/V2__refresh_tokens.sql`
- Create: `backend/.env.example`
- Create: `docker-compose.yml` (repo root)

**Interfaces:**
- Produces: a running Postgres instance on `localhost:5432` (db `duitku`, user `duitku`, password `duitku`), a bootable Spring Boot app on `localhost:8080` with Flyway-managed `users` and `refresh_tokens` tables. Later tasks build entities/repositories against these exact table/column names.

- [ ] **Step 1: Create `docker-compose.yml` at the repo root**

```yaml
services:
  postgres:
    image: postgres:16
    container_name: duitku-postgres
    environment:
      POSTGRES_DB: duitku
      POSTGRES_USER: duitku
      POSTGRES_PASSWORD: duitku
    ports:
      - "5432:5432"
    volumes:
      - duitku-postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U duitku -d duitku"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  duitku-postgres-data:
```

- [ ] **Step 2: Start Postgres and verify it's healthy**

Run: `docker compose up -d postgres && docker compose ps`
Expected: `duitku-postgres` shows status `healthy` (may take a few seconds — re-run `docker compose ps` if still `starting`).

- [ ] **Step 3: Create `backend/pom.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.5</version>
    <relativePath/>
  </parent>

  <groupId>com.duitku</groupId>
  <artifactId>app</artifactId>
  <version>0.1.0-SNAPSHOT</version>
  <name>app</name>
  <description>Duitku backend</description>

  <properties>
    <java.version>21</java.version>
    <jjwt.version>0.12.6</jjwt.version>
    <springdoc.version>2.6.0</springdoc.version>
    <logstash-encoder.version>7.4</logstash-encoder.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <dependency>
      <groupId>org.postgresql</groupId>
      <artifactId>postgresql</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.flywaydb</groupId>
      <artifactId>flyway-core</artifactId>
    </dependency>
    <dependency>
      <groupId>org.flywaydb</groupId>
      <artifactId>flyway-database-postgresql</artifactId>
    </dependency>
    <dependency>
      <groupId>io.jsonwebtoken</groupId>
      <artifactId>jjwt-api</artifactId>
      <version>${jjwt.version}</version>
    </dependency>
    <dependency>
      <groupId>io.jsonwebtoken</groupId>
      <artifactId>jjwt-impl</artifactId>
      <version>${jjwt.version}</version>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>io.jsonwebtoken</groupId>
      <artifactId>jjwt-jackson</artifactId>
      <version>${jjwt.version}</version>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.springdoc</groupId>
      <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
      <version>${springdoc.version}</version>
    </dependency>
    <dependency>
      <groupId>net.logstash.logback</groupId>
      <artifactId>logstash-logback-encoder</artifactId>
      <version>${logstash-encoder.version}</version>
    </dependency>

    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework.security</groupId>
      <artifactId>spring-security-test</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-testcontainers</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.testcontainers</groupId>
      <artifactId>junit-jupiter</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.testcontainers</groupId>
      <artifactId>postgresql</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>testcontainers-bom</artifactId>
        <version>1.20.3</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>
```

- [ ] **Step 4: Create `backend/src/main/java/com/duitku/app/DuitkuApplication.java`**

```java
package com.duitku.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DuitkuApplication {
    public static void main(String[] args) {
        SpringApplication.run(DuitkuApplication.class, args);
    }
}
```

- [ ] **Step 5: Create `backend/src/main/resources/db/migration/V1__users.sql`**

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    oauth_provider VARCHAR(50),
    oauth_provider_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_users_oauth ON users (oauth_provider, oauth_provider_id)
    WHERE oauth_provider IS NOT NULL;
```

- [ ] **Step 6: Create `backend/src/main/resources/db/migration/V2__refresh_tokens.sql`**

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
```

- [ ] **Step 7: Create `backend/src/main/resources/application.yml`**

```yaml
spring:
  application:
    name: duitku
  profiles:
    active: dev
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
  flyway:
    enabled: true
    locations: classpath:db/migration

server:
  port: 8080

management:
  endpoints:
    web:
      exposure:
        include: health

duitku:
  jwt:
    secret: ${JWT_SECRET:dev-only-secret-change-me-please-32bytes-min}
    access-token-ttl-minutes: 15
    refresh-token-ttl-days: 7
  cors:
    allowed-origin: ${CORS_ALLOWED_ORIGIN:http://localhost:5173}
```

- [ ] **Step 8: Create `backend/src/main/resources/application-dev.yml`**

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/duitku
    username: duitku
    password: duitku
  jpa:
    show-sql: true

logging:
  level:
    com.duitku.app: DEBUG
```

- [ ] **Step 9: Create `backend/src/main/resources/application-prod.yml`**

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}

duitku:
  cors:
    allowed-origin: ${CORS_ALLOWED_ORIGIN}
```

- [ ] **Step 10: Create `backend/src/main/resources/logback-spring.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <springProfile name="dev">
        <include resource="org/springframework/boot/logging/logback/defaults.xml"/>
        <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder><pattern>%d{HH:mm:ss.SSS} %-5level [%thread] %logger{36} - %msg%n</pattern></encoder>
        </appender>
        <root level="INFO"><appender-ref ref="CONSOLE"/></root>
    </springProfile>

    <springProfile name="prod">
        <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
            <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
        </appender>
        <root level="INFO"><appender-ref ref="JSON"/></root>
    </springProfile>
</configuration>
```

- [ ] **Step 11: Create `backend/.env.example`**

```
DB_URL=jdbc:postgresql://localhost:5432/duitku
DB_USERNAME=duitku
DB_PASSWORD=duitku
JWT_SECRET=change-me-to-a-random-32-byte-minimum-secret
CORS_ALLOWED_ORIGIN=http://localhost:5173
```

- [ ] **Step 12: Boot the app and verify Flyway migrated the schema**

Run: `cd backend && mvn spring-boot:run`
Expected: log line `Successfully applied 2 migrations`, app starts on port 8080, no errors.

In a second terminal, verify tables exist:
Run: `docker exec duitku-postgres psql -U duitku -d duitku -c '\dt'`
Expected: lists `users`, `refresh_tokens`, and `flyway_schema_history`.

Stop the app (Ctrl+C) before continuing to the next task.

- [ ] **Step 13: Commit**

```bash
git add docker-compose.yml backend/pom.xml backend/src backend/.env.example
git commit -m "feat(backend): project scaffold, Postgres compose, Flyway migrations"
```

---

### Task 2: User/RefreshToken entities, repositories, JwtService

**Files:**
- Create: `backend/src/main/java/com/duitku/app/auth/entity/User.java`
- Create: `backend/src/main/java/com/duitku/app/auth/entity/RefreshToken.java`
- Create: `backend/src/main/java/com/duitku/app/auth/repository/UserRepository.java`
- Create: `backend/src/main/java/com/duitku/app/auth/repository/RefreshTokenRepository.java`
- Create: `backend/src/main/java/com/duitku/app/common/security/JwtService.java`
- Test: `backend/src/test/java/com/duitku/app/common/security/JwtServiceTest.java`

**Interfaces:**
- Consumes: `duitku.jwt.secret` / `duitku.jwt.access-token-ttl-minutes` config from `application.yml` (Task 1).
- Produces: `User` (fields: `id`, `email`, `passwordHash`, `fullName`, `emailVerified`, `oauthProvider`, `oauthProviderId`, `createdAt`, `updatedAt`), `RefreshToken` (fields: `id`, `userId`, `tokenHash`, `expiresAt`, `revoked`, `createdAt`), `UserRepository.findByEmail(String): Optional<User>`, `UserRepository.existsByEmail(String): boolean`, `RefreshTokenRepository` (standard `JpaRepository<RefreshToken, UUID>` plus `findByTokenHash(String): Optional<RefreshToken>`), `JwtService.generateAccessToken(User): String`, `JwtService.validateAndGetUserId(String token): UUID` (throws `JwtException` subtypes on invalid/expired). Task 3 (RefreshTokenService) and Task 4 (AuthService) depend on all of these exact signatures.

- [ ] **Step 1: Create `backend/src/main/java/com/duitku/app/auth/entity/User.java`**

```java
package com.duitku.app.auth.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(name = "oauth_provider")
    private String oauthProvider;

    @Column(name = "oauth_provider_id")
    private String oauthProviderId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected User() {
    }

    public User(String email, String passwordHash, String fullName) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
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

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getFullName() { return fullName; }
    public boolean isEmailVerified() { return emailVerified; }
    public String getOauthProvider() { return oauthProvider; }
    public String getOauthProviderId() { return oauthProviderId; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
```

- [ ] **Step 2: Create `backend/src/main/java/com/duitku/app/auth/entity/RefreshToken.java`**

```java
package com.duitku.app.auth.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean revoked = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RefreshToken() {
    }

    public RefreshToken(UUID userId, String tokenHash, Instant expiresAt) {
        this.userId = userId;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public void revoke() {
        this.revoked = true;
    }

    public boolean isValid() {
        return !revoked && expiresAt.isAfter(Instant.now());
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getTokenHash() { return tokenHash; }
    public Instant getExpiresAt() { return expiresAt; }
    public boolean isRevoked() { return revoked; }
    public Instant getCreatedAt() { return createdAt; }
}
```

- [ ] **Step 3: Create the repositories**

`backend/src/main/java/com/duitku/app/auth/repository/UserRepository.java`:

```java
package com.duitku.app.auth.repository;

import com.duitku.app.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

`backend/src/main/java/com/duitku/app/auth/repository/RefreshTokenRepository.java`:

```java
package com.duitku.app.auth.repository;

import com.duitku.app.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);
}
```

- [ ] **Step 4: Write the failing test for `JwtService`**

Create `backend/src/test/java/com/duitku/app/common/security/JwtServiceTest.java`:

```java
package com.duitku.app.common.security;

import com.duitku.app.auth.entity.User;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService(
            "dev-only-secret-change-me-please-32bytes-min", 15);

    private User userWithId(UUID id) throws Exception {
        User user = new User("test@duitku.app", "hash", "Test User");
        Field idField = User.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(user, id);
        return user;
    }

    @Test
    void generatesTokenThatValidatesBackToSameUserId() throws Exception {
        UUID userId = UUID.randomUUID();
        User user = userWithId(userId);

        String token = jwtService.generateAccessToken(user);
        UUID resolvedId = jwtService.validateAndGetUserId(token);

        assertThat(resolvedId).isEqualTo(userId);
    }

    @Test
    void rejectsTokenSignedWithDifferentSecret() throws Exception {
        User user = userWithId(UUID.randomUUID());
        JwtService otherService = new JwtService("a-completely-different-32byte-secret!!", 15);
        String token = otherService.generateAccessToken(user);

        assertThatThrownBy(() -> jwtService.validateAndGetUserId(token))
                .isInstanceOf(SignatureException.class);
    }

    @Test
    void rejectsExpiredToken() throws Exception {
        JwtService shortLived = new JwtService("dev-only-secret-change-me-please-32bytes-min", 0);
        User user = userWithId(UUID.randomUUID());
        String token = shortLived.generateAccessToken(user);

        Thread.sleep(50);

        assertThatThrownBy(() -> jwtService.validateAndGetUserId(token))
                .isInstanceOf(ExpiredJwtException.class);
    }
}
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `cd backend && mvn test -Dtest=JwtServiceTest`
Expected: FAIL — `JwtService` does not exist yet (compilation error).

- [ ] **Step 6: Create `backend/src/main/java/com/duitku/app/common/security/JwtService.java`**

```java
package com.duitku.app.common.security;

import com.duitku.app.auth.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessTokenTtlMinutes;

    public JwtService(
            @Value("${duitku.jwt.secret}") String secret,
            @Value("${duitku.jwt.access-token-ttl-minutes}") long accessTokenTtlMinutes) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenTtlMinutes = accessTokenTtlMinutes;
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(Duration.ofMinutes(accessTokenTtlMinutes))))
                .signWith(signingKey)
                .compact();
    }

    public UUID validateAndGetUserId(String token) {
        String subject = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
        return UUID.fromString(subject);
    }
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `cd backend && mvn test -Dtest=JwtServiceTest`
Expected: PASS — 3 tests green.

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/com/duitku/app/auth/entity backend/src/main/java/com/duitku/app/auth/repository backend/src/main/java/com/duitku/app/common/security/JwtService.java backend/src/test/java/com/duitku/app/common/security
git commit -m "feat(backend): User/RefreshToken entities, repositories, JwtService"
```

---

### Task 3: RefreshTokenService (opaque token, hashed at rest, rotate/revoke)

**Files:**
- Create: `backend/src/main/java/com/duitku/app/auth/RefreshTokenService.java`
- Test: `backend/src/test/java/com/duitku/app/auth/RefreshTokenServiceTest.java`

**Interfaces:**
- Consumes: `RefreshTokenRepository` (Task 2, `JpaRepository<RefreshToken, UUID>` + `findByTokenHash`), `duitku.jwt.refresh-token-ttl-days` config.
- Produces: `RefreshTokenService.issue(UUID userId): String` (returns the **raw** token, only ever returned here — never persisted raw), `RefreshTokenService.rotate(String rawToken): String` (validates old token, revokes it, issues + returns a new raw token, throws `InvalidRefreshTokenException` if invalid/expired/revoked), `RefreshTokenService.revoke(String rawToken): void`, `RefreshTokenService.resolveUserId(String rawToken): UUID` (throws `InvalidRefreshTokenException` if invalid). Task 4 (AuthService) and Task 6 (refresh/logout endpoints) depend on these exact signatures. `InvalidRefreshTokenException` is created in this task (package `com.duitku.app.common.exception`) since it's first needed here.

- [ ] **Step 1: Write the failing test**

Create `backend/src/test/java/com/duitku/app/auth/RefreshTokenServiceTest.java`:

```java
package com.duitku.app.auth;

import com.duitku.app.auth.entity.RefreshToken;
import com.duitku.app.auth.repository.RefreshTokenRepository;
import com.duitku.app.common.exception.InvalidRefreshTokenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class RefreshTokenServiceTest {

    private RefreshTokenRepository repository;
    private RefreshTokenService service;

    @BeforeEach
    void setUp() {
        repository = mock(RefreshTokenRepository.class);
        service = new RefreshTokenService(repository, 7);
    }

    @Test
    void issueSavesHashedTokenAndReturnsRawToken() {
        UUID userId = UUID.randomUUID();
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        String rawToken = service.issue(userId);

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(repository).save(captor.capture());
        RefreshToken saved = captor.getValue();

        assertThat(rawToken).isNotBlank();
        assertThat(saved.getUserId()).isEqualTo(userId);
        assertThat(saved.getTokenHash()).isNotEqualTo(rawToken);
        assertThat(saved.getExpiresAt()).isAfter(Instant.now());
    }

    @Test
    void resolveUserIdReturnsUserIdForValidToken() {
        UUID userId = UUID.randomUUID();
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        String rawToken = service.issue(userId);

        RefreshToken stored = new RefreshToken(userId, hashOf(rawToken), Instant.now().plusSeconds(60));
        when(repository.findByTokenHash(hashOf(rawToken))).thenReturn(Optional.of(stored));

        assertThat(service.resolveUserId(rawToken)).isEqualTo(userId);
    }

    @Test
    void resolveUserIdRejectsUnknownToken() {
        when(repository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.resolveUserId("not-a-real-token"))
                .isInstanceOf(InvalidRefreshTokenException.class);
    }

    @Test
    void resolveUserIdRejectsRevokedToken() {
        UUID userId = UUID.randomUUID();
        RefreshToken revoked = new RefreshToken(userId, "hash", Instant.now().plusSeconds(60));
        revoked.revoke();
        when(repository.findByTokenHash(anyString())).thenReturn(Optional.of(revoked));

        assertThatThrownBy(() -> service.resolveUserId("some-token"))
                .isInstanceOf(InvalidRefreshTokenException.class);
    }

    @Test
    void rotateRevokesOldTokenAndIssuesNewOne() {
        UUID userId = UUID.randomUUID();
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        String oldRaw = service.issue(userId);
        RefreshToken stored = new RefreshToken(userId, hashOf(oldRaw), Instant.now().plusSeconds(60));
        when(repository.findByTokenHash(hashOf(oldRaw))).thenReturn(Optional.of(stored));

        String newRaw = service.rotate(oldRaw);

        assertThat(newRaw).isNotEqualTo(oldRaw);
        assertThat(stored.isRevoked()).isTrue();
    }

    private String hashOf(String rawToken) {
        return org.springframework.util.DigestUtils.appendMd5DigestAsHex(
                rawToken.getBytes(), new StringBuilder()).toString();
    }
}
```

Note: the test's local `hashOf` helper is only used to construct expectations; it does not need to match the service's real hash algorithm byte-for-byte because the service always hashes with its own method before both storing and looking up — the test only needs `repository.findByTokenHash(...)` stubbed with *some* stable string tied to the raw token. Replace the `hashOf` calls above with a `reflectHash(rawToken)` helper that calls the service's actual hashing via reflection **only if** the straightforward stubbing above turns out inconsistent when you run it. In practice, since `issue()` and `rotate()` never expose the hash, stub `findByTokenHash` with `any()` matcher instead of a specific string to avoid coupling to the hash algorithm:

Replace `when(repository.findByTokenHash(hashOf(rawToken)))` with `when(repository.findByTokenHash(anyString()))` in both `resolveUserIdReturnsUserIdForValidToken` and `rotateRevokesOldTokenAndIssuesNewOne`, and drop the unused `hashOf` method. Final corrected test file:

```java
package com.duitku.app.auth;

import com.duitku.app.auth.entity.RefreshToken;
import com.duitku.app.auth.repository.RefreshTokenRepository;
import com.duitku.app.common.exception.InvalidRefreshTokenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class RefreshTokenServiceTest {

    private RefreshTokenRepository repository;
    private RefreshTokenService service;

    @BeforeEach
    void setUp() {
        repository = mock(RefreshTokenRepository.class);
        service = new RefreshTokenService(repository, 7);
    }

    @Test
    void issueSavesHashedTokenAndReturnsRawToken() {
        UUID userId = UUID.randomUUID();
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        String rawToken = service.issue(userId);

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(repository).save(captor.capture());
        RefreshToken saved = captor.getValue();

        assertThat(rawToken).isNotBlank();
        assertThat(saved.getUserId()).isEqualTo(userId);
        assertThat(saved.getTokenHash()).isNotEqualTo(rawToken);
        assertThat(saved.getExpiresAt()).isAfter(Instant.now());
    }

    @Test
    void resolveUserIdReturnsUserIdForValidToken() {
        UUID userId = UUID.randomUUID();
        RefreshToken stored = new RefreshToken(userId, "irrelevant-hash", Instant.now().plusSeconds(60));
        when(repository.findByTokenHash(anyString())).thenReturn(Optional.of(stored));

        assertThat(service.resolveUserId("some-raw-token")).isEqualTo(userId);
    }

    @Test
    void resolveUserIdRejectsUnknownToken() {
        when(repository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.resolveUserId("not-a-real-token"))
                .isInstanceOf(InvalidRefreshTokenException.class);
    }

    @Test
    void resolveUserIdRejectsRevokedToken() {
        UUID userId = UUID.randomUUID();
        RefreshToken revoked = new RefreshToken(userId, "hash", Instant.now().plusSeconds(60));
        revoked.revoke();
        when(repository.findByTokenHash(anyString())).thenReturn(Optional.of(revoked));

        assertThatThrownBy(() -> service.resolveUserId("some-token"))
                .isInstanceOf(InvalidRefreshTokenException.class);
    }

    @Test
    void rotateRevokesOldTokenAndIssuesNewOne() {
        UUID userId = UUID.randomUUID();
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        RefreshToken stored = new RefreshToken(userId, "irrelevant-hash", Instant.now().plusSeconds(60));
        when(repository.findByTokenHash(anyString())).thenReturn(Optional.of(stored));

        String newRaw = service.rotate("old-raw-token");

        assertThat(newRaw).isNotBlank();
        assertThat(stored.isRevoked()).isTrue();
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && mvn test -Dtest=RefreshTokenServiceTest`
Expected: FAIL — `RefreshTokenService` and `InvalidRefreshTokenException` don't exist yet (compilation error).

- [ ] **Step 3: Create `backend/src/main/java/com/duitku/app/common/exception/InvalidRefreshTokenException.java`**

```java
package com.duitku.app.common.exception;

public class InvalidRefreshTokenException extends RuntimeException {
    public InvalidRefreshTokenException(String message) {
        super(message);
    }
}
```

- [ ] **Step 4: Create `backend/src/main/java/com/duitku/app/auth/RefreshTokenService.java`**

```java
package com.duitku.app.auth;

import com.duitku.app.auth.entity.RefreshToken;
import com.duitku.app.auth.repository.RefreshTokenRepository;
import com.duitku.app.common.exception.InvalidRefreshTokenException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository repository;
    private final long refreshTokenTtlDays;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(
            RefreshTokenRepository repository,
            @Value("${duitku.jwt.refresh-token-ttl-days}") long refreshTokenTtlDays) {
        this.repository = repository;
        this.refreshTokenTtlDays = refreshTokenTtlDays;
    }

    public String issue(UUID userId) {
        String rawToken = generateRawToken();
        RefreshToken entity = new RefreshToken(
                userId, hash(rawToken), Instant.now().plus(Duration.ofDays(refreshTokenTtlDays)));
        repository.save(entity);
        return rawToken;
    }

    public UUID resolveUserId(String rawToken) {
        RefreshToken stored = repository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new InvalidRefreshTokenException("Refresh token not recognized"));
        if (!stored.isValid()) {
            throw new InvalidRefreshTokenException("Refresh token expired or revoked");
        }
        return stored.getUserId();
    }

    public String rotate(String rawToken) {
        RefreshToken stored = repository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new InvalidRefreshTokenException("Refresh token not recognized"));
        if (!stored.isValid()) {
            throw new InvalidRefreshTokenException("Refresh token expired or revoked");
        }
        stored.revoke();
        repository.save(stored);
        return issue(stored.getUserId());
    }

    public void revoke(String rawToken) {
        repository.findByTokenHash(hash(rawToken)).ifPresent(stored -> {
            stored.revoke();
            repository.save(stored);
        });
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd backend && mvn test -Dtest=RefreshTokenServiceTest`
Expected: PASS — 5 tests green.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/duitku/app/auth/RefreshTokenService.java backend/src/main/java/com/duitku/app/common/exception/InvalidRefreshTokenException.java backend/src/test/java/com/duitku/app/auth/RefreshTokenServiceTest.java
git commit -m "feat(backend): RefreshTokenService with hashed-at-rest rotation"
```

---

### Task 4: AuthService (register/login)

**Files:**
- Modify: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/java/com/duitku/app/auth/dto/RegisterRequest.java`
- Create: `backend/src/main/java/com/duitku/app/auth/dto/LoginRequest.java`
- Create: `backend/src/main/java/com/duitku/app/auth/dto/UserResponse.java`
- Create: `backend/src/main/java/com/duitku/app/auth/dto/AuthResult.java`
- Create: `backend/src/main/java/com/duitku/app/common/exception/DuplicateEmailException.java`
- Create: `backend/src/main/java/com/duitku/app/common/exception/InvalidCredentialsException.java`
- Create: `backend/src/main/java/com/duitku/app/auth/AuthService.java`
- Test: `backend/src/test/java/com/duitku/app/auth/AuthServiceTest.java`

**Interfaces:**
- Consumes: `UserRepository`, `RefreshTokenService.issue(UUID): String` (Task 2/3), `JwtService.generateAccessToken(User): String` (Task 2), Spring Security's `PasswordEncoder` (interface only — the bean is defined in Task 5's `SecurityConfig`; this task's unit test mocks it directly).
- Produces: `AuthService.register(RegisterRequest): AuthResult` (throws `DuplicateEmailException`), `AuthService.login(LoginRequest): AuthResult` (throws `InvalidCredentialsException`), where `AuthResult(UserResponse user, String accessToken, String refreshToken)`. Task 5 (`AuthController`) depends on these exact method names/types — note `AuthResult.refreshToken()` is only ever put in a cookie, never in a JSON response body.

- [ ] **Step 1: Add snake_case JSON naming to `application.yml`**

The parent API spec documents JSON fields as `access_token`, `full_name`, etc. Add this to `backend/src/main/resources/application.yml` under the `spring:` key (alongside `application:`, `profiles:`, `jpa:`, `flyway:`):

```yaml
  jackson:
    property-naming-strategy: SNAKE_CASE
```

- [ ] **Step 2: Write the failing test**

Create `backend/src/test/java/com/duitku/app/auth/AuthServiceTest.java`:

```java
package com.duitku.app.auth;

import com.duitku.app.auth.dto.AuthResult;
import com.duitku.app.auth.dto.LoginRequest;
import com.duitku.app.auth.dto.RegisterRequest;
import com.duitku.app.auth.entity.User;
import com.duitku.app.auth.repository.UserRepository;
import com.duitku.app.common.exception.DuplicateEmailException;
import com.duitku.app.common.exception.InvalidCredentialsException;
import com.duitku.app.common.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private RefreshTokenService refreshTokenService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtService = mock(JwtService.class);
        refreshTokenService = mock(RefreshTokenService.class);
        authService = new AuthService(userRepository, passwordEncoder, jwtService, refreshTokenService);
    }

    @Test
    void registerSavesNewUserAndReturnsTokens() {
        RegisterRequest request = new RegisterRequest("raraku@duitku.app", "password123", "Raraku");
        when(userRepository.existsByEmail("raraku@duitku.app")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed-password");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateAccessToken(any())).thenReturn("access-token-value");
        when(refreshTokenService.issue(any())).thenReturn("refresh-token-value");

        AuthResult result = authService.register(request);

        assertThat(result.user().email()).isEqualTo("raraku@duitku.app");
        assertThat(result.user().fullName()).isEqualTo("Raraku");
        assertThat(result.accessToken()).isEqualTo("access-token-value");
        assertThat(result.refreshToken()).isEqualTo("refresh-token-value");
        verify(userRepository).save(argThat(u -> u.getPasswordHash().equals("hashed-password")));
    }

    @Test
    void registerRejectsDuplicateEmail() {
        RegisterRequest request = new RegisterRequest("raraku@duitku.app", "password123", "Raraku");
        when(userRepository.existsByEmail("raraku@duitku.app")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateEmailException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void loginReturnsTokensForValidCredentials() {
        User user = new User("raraku@duitku.app", "hashed-password", "Raraku");
        LoginRequest request = new LoginRequest("raraku@duitku.app", "password123");
        when(userRepository.findByEmail("raraku@duitku.app")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashed-password")).thenReturn(true);
        when(jwtService.generateAccessToken(user)).thenReturn("access-token-value");
        when(refreshTokenService.issue(any())).thenReturn("refresh-token-value");

        AuthResult result = authService.login(request);

        assertThat(result.accessToken()).isEqualTo("access-token-value");
        assertThat(result.refreshToken()).isEqualTo("refresh-token-value");
    }

    @Test
    void loginRejectsWrongPassword() {
        User user = new User("raraku@duitku.app", "hashed-password", "Raraku");
        LoginRequest request = new LoginRequest("raraku@duitku.app", "wrong-password");
        when(userRepository.findByEmail("raraku@duitku.app")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "hashed-password")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void loginRejectsUnknownEmail() {
        LoginRequest request = new LoginRequest("unknown@duitku.app", "password123");
        when(userRepository.findByEmail("unknown@duitku.app")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class);
    }
}
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd backend && mvn test -Dtest=AuthServiceTest`
Expected: FAIL — `AuthService` and its DTOs/exceptions don't exist yet (compilation error).

- [ ] **Step 4: Create the DTOs**

`backend/src/main/java/com/duitku/app/auth/dto/RegisterRequest.java`:

```java
package com.duitku.app.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, message = "Password minimal 8 karakter") String password,
        @NotBlank String fullName
) {
}
```

`backend/src/main/java/com/duitku/app/auth/dto/LoginRequest.java`:

```java
package com.duitku.app.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
) {
}
```

`backend/src/main/java/com/duitku/app/auth/dto/UserResponse.java`:

```java
package com.duitku.app.auth.dto;

import com.duitku.app.auth.entity.User;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String fullName,
        boolean emailVerified,
        Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(), user.getEmail(), user.getFullName(),
                user.isEmailVerified(), user.getCreatedAt());
    }
}
```

`backend/src/main/java/com/duitku/app/auth/dto/AuthResult.java`:

```java
package com.duitku.app.auth.dto;

public record AuthResult(UserResponse user, String accessToken, String refreshToken) {
}
```

- [ ] **Step 5: Create the exceptions**

`backend/src/main/java/com/duitku/app/common/exception/DuplicateEmailException.java`:

```java
package com.duitku.app.common.exception;

public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String message) {
        super(message);
    }
}
```

`backend/src/main/java/com/duitku/app/common/exception/InvalidCredentialsException.java`:

```java
package com.duitku.app.common.exception;

public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
}
```

- [ ] **Step 6: Create `backend/src/main/java/com/duitku/app/auth/AuthService.java`**

```java
package com.duitku.app.auth;

import com.duitku.app.auth.dto.AuthResult;
import com.duitku.app.auth.dto.LoginRequest;
import com.duitku.app.auth.dto.RegisterRequest;
import com.duitku.app.auth.dto.UserResponse;
import com.duitku.app.auth.entity.User;
import com.duitku.app.auth.repository.UserRepository;
import com.duitku.app.common.exception.DuplicateEmailException;
import com.duitku.app.common.exception.InvalidCredentialsException;
import com.duitku.app.common.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    public AuthResult register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateEmailException("Email sudah terdaftar");
        }
        User user = new User(request.email(), passwordEncoder.encode(request.password()), request.fullName());
        user = userRepository.save(user);
        return issueTokens(user);
    }

    public AuthResult login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidCredentialsException("Email atau password salah"));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Email atau password salah");
        }
        return issueTokens(user);
    }

    private AuthResult issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = refreshTokenService.issue(user.getId());
        return new AuthResult(UserResponse.from(user), accessToken, refreshToken);
    }
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `cd backend && mvn test -Dtest=AuthServiceTest`
Expected: PASS — 5 tests green.

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/resources/application.yml backend/src/main/java/com/duitku/app/auth/dto backend/src/main/java/com/duitku/app/common/exception backend/src/main/java/com/duitku/app/auth/AuthService.java backend/src/test/java/com/duitku/app/auth/AuthServiceTest.java
git commit -m "feat(backend): AuthService register/login with DTOs and exceptions"
```

---

### Task 5: AuthController (register/login/me) + SecurityConfig + JwtAuthenticationFilter

**Files:**
- Create: `backend/src/main/java/com/duitku/app/auth/dto/TokenResponse.java`
- Create: `backend/src/main/java/com/duitku/app/common/security/JwtAuthenticationFilter.java`
- Create: `backend/src/main/java/com/duitku/app/common/config/SecurityConfig.java`
- Create: `backend/src/main/java/com/duitku/app/auth/AuthController.java`
- Test: `backend/src/test/java/com/duitku/app/auth/AuthControllerTest.java`

**Interfaces:**
- Consumes: `AuthService.register/login` (Task 4), `JwtService.validateAndGetUserId(String): UUID` (Task 2), `UserRepository.findById` (Spring Data, Task 2), `duitku.cors.allowed-origin` config (Task 1).
- Produces: live HTTP endpoints `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`; a `SecurityFilterChain` bean that Task 6 and Task 7 build on; cookie name constant `duitku_refresh_token` used by Task 6's refresh/logout endpoints — **note this exact name**, Task 6 reads it via `@CookieValue("duitku_refresh_token")`.

- [ ] **Step 1: Create `backend/src/main/java/com/duitku/app/auth/dto/TokenResponse.java`**

```java
package com.duitku.app.auth.dto;

public record TokenResponse(UserResponse user, String accessToken) {
}
```

- [ ] **Step 2: Create `backend/src/main/java/com/duitku/app/common/security/JwtAuthenticationFilter.java`**

```java
package com.duitku.app.common.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                UUID userId = jwtService.validateAndGetUserId(token);
                var authentication = new UsernamePasswordAuthenticationToken(userId, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (JwtException | IllegalArgumentException ex) {
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
```

- [ ] **Step 3: Create `backend/src/main/java/com/duitku/app/common/config/SecurityConfig.java`**

```java
package com.duitku.app.common.config;

import com.duitku.app.common.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final String allowedOrigin;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            @Value("${duitku.cors.allowed-origin}") String allowedOrigin) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.allowedOrigin = allowedOrigin;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Disabling anonymous auth means an unauthenticated request has NO Authentication
                // object, so .anyRequest().authenticated() throws an AuthenticationException (401
                // via the entry point below) instead of an AccessDeniedException (403).
                .anonymous(AbstractHttpConfigurer::disable)
                .exceptionHandling(ex -> ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/v1/auth/register", "/api/v1/auth/login",
                                "/api/v1/auth/refresh", "/api/v1/auth/logout",
                                "/swagger-ui/**", "/v3/api-docs/**", "/actuator/health")
                        .permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigin));
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

- [ ] **Step 4: Create `backend/src/main/java/com/duitku/app/auth/AuthController.java`**

```java
package com.duitku.app.auth;

import com.duitku.app.auth.dto.AuthResult;
import com.duitku.app.auth.dto.LoginRequest;
import com.duitku.app.auth.dto.RegisterRequest;
import com.duitku.app.auth.dto.TokenResponse;
import com.duitku.app.auth.dto.UserResponse;
import com.duitku.app.auth.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    static final String REFRESH_COOKIE_NAME = "duitku_refresh_token";
    private static final long REFRESH_COOKIE_MAX_AGE_SECONDS = 7L * 24 * 60 * 60;

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<TokenResponse> register(@Valid @RequestBody RegisterRequest request) {
        return withRefreshCookie(authService.register(request), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return withRefreshCookie(authService.login(request), HttpStatus.OK);
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        return userRepository.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> new IllegalStateException("Authenticated user no longer exists"));
    }

    static ResponseCookie refreshCookie(String rawToken) {
        // secure(false) is correct for local HTTP dev; application-prod.yml-driven deploys
        // terminate TLS in front of the app, where this should be true.
        return ResponseCookie.from(REFRESH_COOKIE_NAME, rawToken)
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/api/v1/auth")
                .maxAge(REFRESH_COOKIE_MAX_AGE_SECONDS)
                .build();
    }

    private ResponseEntity<TokenResponse> withRefreshCookie(AuthResult result, HttpStatus status) {
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, refreshCookie(result.refreshToken()).toString())
                .body(new TokenResponse(result.user(), result.accessToken()));
    }
}
```

- [ ] **Step 5: Write the test**

Create `backend/src/test/java/com/duitku/app/auth/AuthControllerTest.java`:

```java
package com.duitku.app.auth;

import com.duitku.app.auth.dto.AuthResult;
import com.duitku.app.auth.dto.UserResponse;
import com.duitku.app.auth.entity.User;
import com.duitku.app.auth.repository.UserRepository;
import com.duitku.app.common.config.SecurityConfig;
import com.duitku.app.common.security.JwtAuthenticationFilter;
import com.duitku.app.common.security.JwtService;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtService jwtService;

    @Test
    void registerReturns201WithAccessTokenAndSetsRefreshCookie() throws Exception {
        UserResponse user = new UserResponse(UUID.randomUUID(), "raraku@duitku.app", "Raraku", false, Instant.now());
        when(authService.register(any())).thenReturn(new AuthResult(user, "access-token-value", "refresh-token-value"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"raraku@duitku.app","password":"password123","full_name":"Raraku"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.access_token").value("access-token-value"))
                .andExpect(jsonPath("$.user.email").value("raraku@duitku.app"))
                .andExpect(header().string("Set-Cookie", containsString("duitku_refresh_token=refresh-token-value")));
    }

    @Test
    void registerReturns400ForInvalidEmail() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"not-an-email","password":"password123","full_name":"Raraku"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void meReturnsUserForValidBearerToken() throws Exception {
        UUID userId = UUID.randomUUID();
        User user = new User("raraku@duitku.app", "hash", "Raraku");
        when(jwtService.validateAndGetUserId("valid-token")).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("raraku@duitku.app"));
    }

    @Test
    void meReturns401WithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meReturns401ForInvalidToken() throws Exception {
        when(jwtService.validateAndGetUserId("bad-token")).thenThrow(new JwtException("invalid"));

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer bad-token"))
                .andExpect(status().isUnauthorized());
    }
}
```

- [ ] **Step 6: Run the tests**

Run: `cd backend && mvn test -Dtest=AuthControllerTest`
Expected: PASS — 5 tests green. If `meReturns401WithoutToken` or `meReturns401ForInvalidToken` return 403 instead of 401, double-check the `.anonymous(AbstractHttpConfigurer::disable)` and `.exceptionHandling(...)` lines were added exactly as above — this is the standard Spring Security 6 gotcha where a missing `Authentication` is otherwise treated as an authorization failure rather than an authentication failure.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/com/duitku/app/auth/dto/TokenResponse.java backend/src/main/java/com/duitku/app/common/security/JwtAuthenticationFilter.java backend/src/main/java/com/duitku/app/common/config/SecurityConfig.java backend/src/main/java/com/duitku/app/auth/AuthController.java backend/src/test/java/com/duitku/app/auth/AuthControllerTest.java
git commit -m "feat(backend): AuthController (register/login/me), SecurityConfig, JWT filter"
```

---

### Task 6: Refresh/logout endpoints + GlobalExceptionHandler

**Files:**
- Create: `backend/src/main/java/com/duitku/app/common/dto/ErrorResponse.java`
- Create: `backend/src/main/java/com/duitku/app/common/exception/GlobalExceptionHandler.java`
- Modify: `backend/src/main/java/com/duitku/app/auth/AuthService.java` (add `refresh`/`logout`)
- Modify: `backend/src/main/java/com/duitku/app/auth/AuthController.java` (add `/refresh`/`/logout`)
- Modify: `backend/src/test/java/com/duitku/app/auth/AuthControllerTest.java` (add new cases)

**Interfaces:**
- Consumes: `RefreshTokenService.resolveUserId/rotate/revoke` (Task 3), `AuthController.REFRESH_COOKIE_NAME` / `refreshCookie(String)` (Task 5).
- Produces: `AuthService.refresh(String rawRefreshToken): AuthResult` (throws `InvalidRefreshTokenException`), `AuthService.logout(String rawRefreshToken): void`; live `POST /api/v1/auth/refresh` and `POST /api/v1/auth/logout` endpoints; a `GlobalExceptionHandler` mapping `DuplicateEmailException`→409, `InvalidCredentialsException`→401, `InvalidRefreshTokenException`→401, Bean Validation failures→400, anything else→500 — every later controller in the app (Tahap 2+) inherits this handler automatically.

- [ ] **Step 1: Create `backend/src/main/java/com/duitku/app/common/dto/ErrorResponse.java`**

```java
package com.duitku.app.common.dto;

import java.time.Instant;
import java.util.Map;

public record ErrorResponse(Instant timestamp, int status, String message, Map<String, String> fieldErrors) {

    public static ErrorResponse of(int status, String message) {
        return new ErrorResponse(Instant.now(), status, message, null);
    }

    public static ErrorResponse ofValidation(int status, String message, Map<String, String> fieldErrors) {
        return new ErrorResponse(Instant.now(), status, message, fieldErrors);
    }
}
```

- [ ] **Step 2: Create `backend/src/main/java/com/duitku/app/common/exception/GlobalExceptionHandler.java`**

```java
package com.duitku.app.common.exception;

import com.duitku.app.common.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEmail(DuplicateEmailException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse.of(HttpStatus.CONFLICT.value(), ex.getMessage()));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(InvalidCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse.of(HttpStatus.UNAUTHORIZED.value(), ex.getMessage()));
    }

    @ExceptionHandler(InvalidRefreshTokenException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRefreshToken(InvalidRefreshTokenException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse.of(HttpStatus.UNAUTHORIZED.value(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(fe -> fieldErrors.put(fe.getField(), fe.getDefaultMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.ofValidation(HttpStatus.BAD_REQUEST.value(), "Validasi gagal", fieldErrors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Terjadi kesalahan pada server"));
    }
}
```

- [ ] **Step 3: Replace `backend/src/main/java/com/duitku/app/auth/AuthService.java` with the full updated file (adds `refresh`/`logout`)**

```java
package com.duitku.app.auth;

import com.duitku.app.auth.dto.AuthResult;
import com.duitku.app.auth.dto.LoginRequest;
import com.duitku.app.auth.dto.RegisterRequest;
import com.duitku.app.auth.dto.UserResponse;
import com.duitku.app.auth.entity.User;
import com.duitku.app.auth.repository.UserRepository;
import com.duitku.app.common.exception.DuplicateEmailException;
import com.duitku.app.common.exception.InvalidCredentialsException;
import com.duitku.app.common.exception.InvalidRefreshTokenException;
import com.duitku.app.common.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    public AuthResult register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateEmailException("Email sudah terdaftar");
        }
        User user = new User(request.email(), passwordEncoder.encode(request.password()), request.fullName());
        user = userRepository.save(user);
        return issueTokens(user);
    }

    public AuthResult login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidCredentialsException("Email atau password salah"));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Email atau password salah");
        }
        return issueTokens(user);
    }

    public AuthResult refresh(String rawRefreshToken) {
        UUID userId = refreshTokenService.resolveUserId(rawRefreshToken);
        String newRawRefreshToken = refreshTokenService.rotate(rawRefreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidRefreshTokenException("User untuk refresh token ini tidak ditemukan"));
        String newAccessToken = jwtService.generateAccessToken(user);
        return new AuthResult(UserResponse.from(user), newAccessToken, newRawRefreshToken);
    }

    public void logout(String rawRefreshToken) {
        refreshTokenService.revoke(rawRefreshToken);
    }

    private AuthResult issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = refreshTokenService.issue(user.getId());
        return new AuthResult(UserResponse.from(user), accessToken, refreshToken);
    }
}
```

- [ ] **Step 4: Replace `backend/src/main/java/com/duitku/app/auth/AuthController.java` with the full updated file (adds `/refresh`/`/logout`)**

```java
package com.duitku.app.auth;

import com.duitku.app.auth.dto.AuthResult;
import com.duitku.app.auth.dto.LoginRequest;
import com.duitku.app.auth.dto.RegisterRequest;
import com.duitku.app.auth.dto.TokenResponse;
import com.duitku.app.auth.dto.UserResponse;
import com.duitku.app.auth.repository.UserRepository;
import com.duitku.app.common.exception.InvalidRefreshTokenException;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    static final String REFRESH_COOKIE_NAME = "duitku_refresh_token";
    private static final long REFRESH_COOKIE_MAX_AGE_SECONDS = 7L * 24 * 60 * 60;

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<TokenResponse> register(@Valid @RequestBody RegisterRequest request) {
        return withRefreshCookie(authService.register(request), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return withRefreshCookie(authService.login(request), HttpStatus.OK);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken) {
        if (refreshToken == null) {
            throw new InvalidRefreshTokenException("Refresh token tidak ditemukan");
        }
        return withRefreshCookie(authService.refresh(refreshToken), HttpStatus.OK);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken) {
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }
        ResponseCookie expiredCookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/api/v1/auth")
                .maxAge(0)
                .build();
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, expiredCookie.toString())
                .build();
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        return userRepository.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> new IllegalStateException("Authenticated user no longer exists"));
    }

    static ResponseCookie refreshCookie(String rawToken) {
        // secure(false) is correct for local HTTP dev; application-prod.yml-driven deploys
        // terminate TLS in front of the app, where this should be true.
        return ResponseCookie.from(REFRESH_COOKIE_NAME, rawToken)
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/api/v1/auth")
                .maxAge(REFRESH_COOKIE_MAX_AGE_SECONDS)
                .build();
    }

    private ResponseEntity<TokenResponse> withRefreshCookie(AuthResult result, HttpStatus status) {
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, refreshCookie(result.refreshToken()).toString())
                .body(new TokenResponse(result.user(), result.accessToken()));
    }
}
```

- [ ] **Step 5: Replace `backend/src/test/java/com/duitku/app/auth/AuthControllerTest.java` with the full updated file (adds refresh/logout/error cases)**

```java
package com.duitku.app.auth;

import com.duitku.app.auth.dto.AuthResult;
import com.duitku.app.auth.dto.UserResponse;
import com.duitku.app.auth.entity.User;
import com.duitku.app.auth.repository.UserRepository;
import com.duitku.app.common.config.SecurityConfig;
import com.duitku.app.common.exception.DuplicateEmailException;
import com.duitku.app.common.exception.InvalidCredentialsException;
import com.duitku.app.common.security.JwtAuthenticationFilter;
import com.duitku.app.common.security.JwtService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtService jwtService;

    @Test
    void registerReturns201WithAccessTokenAndSetsRefreshCookie() throws Exception {
        UserResponse user = new UserResponse(UUID.randomUUID(), "raraku@duitku.app", "Raraku", false, Instant.now());
        when(authService.register(any())).thenReturn(new AuthResult(user, "access-token-value", "refresh-token-value"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"raraku@duitku.app","password":"password123","full_name":"Raraku"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.access_token").value("access-token-value"))
                .andExpect(jsonPath("$.user.email").value("raraku@duitku.app"))
                .andExpect(header().string("Set-Cookie", containsString("duitku_refresh_token=refresh-token-value")));
    }

    @Test
    void registerReturns400ForInvalidEmail() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"not-an-email","password":"password123","full_name":"Raraku"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerReturns409ForDuplicateEmail() throws Exception {
        when(authService.register(any())).thenThrow(new DuplicateEmailException("Email sudah terdaftar"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"raraku@duitku.app","password":"password123","full_name":"Raraku"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email sudah terdaftar"));
    }

    @Test
    void loginReturns401ForBadCredentials() throws Exception {
        when(authService.login(any())).thenThrow(new InvalidCredentialsException("Email atau password salah"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"raraku@duitku.app","password":"wrong"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meReturnsUserForValidBearerToken() throws Exception {
        UUID userId = UUID.randomUUID();
        User user = new User("raraku@duitku.app", "hash", "Raraku");
        when(jwtService.validateAndGetUserId("valid-token")).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("raraku@duitku.app"));
    }

    @Test
    void meReturns401WithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meReturns401ForInvalidToken() throws Exception {
        when(jwtService.validateAndGetUserId("bad-token")).thenThrow(new JwtException("invalid"));

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer bad-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshRotatesCookieAndReturnsNewAccessToken() throws Exception {
        UserResponse user = new UserResponse(UUID.randomUUID(), "raraku@duitku.app", "Raraku", false, Instant.now());
        when(authService.refresh("old-refresh-token"))
                .thenReturn(new AuthResult(user, "new-access-token", "new-refresh-token"));

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(new Cookie("duitku_refresh_token", "old-refresh-token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token").value("new-access-token"))
                .andExpect(header().string("Set-Cookie", containsString("duitku_refresh_token=new-refresh-token")));
    }

    @Test
    void refreshReturns401WithoutCookie() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutRevokesTokenAndClearsCookie() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(new Cookie("duitku_refresh_token", "some-token")))
                .andExpect(status().isNoContent())
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));

        verify(authService).logout("some-token");
    }
}
```

- [ ] **Step 6: Run all backend unit/slice tests**

Run: `cd backend && mvn test`
Expected: PASS — all tests across `JwtServiceTest`, `RefreshTokenServiceTest`, `AuthServiceTest`, `AuthControllerTest` green (18 tests total).

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/com/duitku/app/common/dto/ErrorResponse.java backend/src/main/java/com/duitku/app/common/exception/GlobalExceptionHandler.java backend/src/main/java/com/duitku/app/auth/AuthService.java backend/src/main/java/com/duitku/app/auth/AuthController.java backend/src/test/java/com/duitku/app/auth/AuthControllerTest.java
git commit -m "feat(backend): refresh/logout endpoints and global exception handling"
```

---

### Task 7: OpenAPI / Swagger UI config

**Files:**
- Create: `backend/src/main/java/com/duitku/app/common/config/OpenApiConfig.java`

**Interfaces:**
- Consumes: nothing new (SpringDoc auto-discovers `@RestController`s from Task 5/6).
- Produces: `/v3/api-docs` and `/swagger-ui.html` reachable and unauthenticated (already permitted in Task 5's `SecurityConfig`).

- [ ] **Step 1: Create `backend/src/main/java/com/duitku/app/common/config/OpenApiConfig.java`**

```java
package com.duitku.app.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI duitkuOpenApi() {
        return new OpenAPI()
                .info(new Info().title("Duitku API").version("v1")
                        .description("Personal finance API for Duitku"))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
                .components(new Components().addSecuritySchemes(BEARER_SCHEME,
                        new SecurityScheme()
                                .name(BEARER_SCHEME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
```

- [ ] **Step 2: Boot the app and verify Swagger UI is reachable**

Run: `docker compose up -d postgres && cd backend && mvn spring-boot:run`

In a second terminal:
Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/swagger-ui.html`
Expected: `200` (or `302` redirecting to `/swagger-ui/index.html`, which is also correct SpringDoc behavior — follow with `curl -sL ... | grep -c "Duitku API"` if so).

Run: `curl -s http://localhost:8080/v3/api-docs | grep -o '"/api/v1/auth/[a-z]*"' | sort -u`
Expected: lists `"/api/v1/auth/login"`, `"/api/v1/auth/logout"`, `"/api/v1/auth/me"`, `"/api/v1/auth/refresh"`, `"/api/v1/auth/register"`.

Stop the app (Ctrl+C) before continuing.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/duitku/app/common/config/OpenApiConfig.java
git commit -m "feat(backend): OpenAPI/Swagger UI config"
```
