# Prompt: Build Personal Finance Web App (Spring Boot + React)

## Context
Bikinin aku personal finance web application untuk penggunaan pribadi (1 user awalnya, tapi harus support multi-user via login). Aplikasi ini harus modular — nanti aku mau nambah fitur lain seperti daily activity tracker, habit tracker, dll tanpa refactor besar-besaran.

## Tech Stack

### Backend
- **Framework:** Spring Boot 3.x (Java 21)
- **Database:** PostgreSQL (untuk local dev) — desain kompatibel dengan AWS RDS / Aurora Serverless nanti
- **ORM:** Spring Data JPA + Hibernate
- **Auth:** Spring Security + JWT (access token + refresh token)
- **Password hashing:** BCrypt
- **Validation:** Jakarta Bean Validation
- **API:** REST, JSON, versioning `/api/v1/...`
- **Documentation:** SpringDoc OpenAPI (Swagger UI)
- **Build:** Maven
- **Testing:** JUnit 5 + Mockito + Testcontainers untuk integration test

### Frontend
- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS (mobile-first, fully responsive: mobile → tablet → laptop → desktop)
- **UI components:** shadcn/ui atau HeadlessUI
- **State management:** Zustand (ringan, tidak overkill)
- **Data fetching:** TanStack Query (React Query)
- **Form:** React Hook Form + Zod validation
- **Router:** React Router v6
- **Charts:** Recharts (untuk visualisasi keuangan)
- **Icons:** lucide-react

## Requirements

### Authentication & Authorization
- Register (email + password + nama)
- Login (return JWT access token 15 menit + refresh token 7 hari)
- Logout (invalidate refresh token)
- Password reset via email (skip email sending dulu, endpoint aja)
- Protected routes di frontend (redirect ke /login kalau belum auth)
- Setiap user cuma bisa akses data miliknya sendiri (row-level isolation via `user_id`)

### Core Feature — Personal Finance
1. **Accounts** (rekening/dompet): nama, tipe (cash/bank/e-wallet/credit), saldo awal, mata uang
2. **Categories**: income & expense, dengan icon & warna, bisa custom
3. **Transactions**: tanggal, jumlah, tipe (income/expense/transfer), kategori, akun, deskripsi, tag opsional
4. **Budgets**: set budget per kategori per bulan, tracking progress
5. **Dashboard**:
   - Total saldo semua akun
   - Cashflow bulan ini (income vs expense)
   - Top 5 kategori pengeluaran (pie chart)
   - Trend 6 bulan terakhir (line chart)
   - Recent transactions (10 terakhir)
6. **Reports**: filter by date range, kategori, akun; export CSV

### Modular Architecture (untuk fitur tambahan nanti)
- Struktur package backend: `com.raraku.app.<module>` (contoh: `finance`, `activity`, `common`, `auth`)
- Setiap module: `controller`, `service`, `repository`, `entity`, `dto`, `mapper`
- Shared: `common` package untuk exception handler, base entity, security config
- Frontend: `src/features/<module>/` (finance, activity, dll) — masing-masing punya components, hooks, api client, types

### Responsive Design
- **Mobile-first** approach (Tailwind breakpoints: default → sm → md → lg → xl)
- Bottom nav bar di mobile, sidebar di tablet/desktop
- Tabel transaksi: card view di mobile, table view di desktop
- Test di 3 breakpoint: 375px (mobile), 768px (tablet), 1280px (laptop)

### Non-Functional
- **CORS:** configurable, allow frontend origin
- **Error handling:** global exception handler dengan format response konsisten `{ error, message, timestamp, path }`
- **Logging:** SLF4J dengan structured log
- **Environment config:** `application.yml` + profile (dev, prod), pakai env vars untuk secrets
- **Migration:** Flyway atau Liquibase
- **API rate limiting:** basic (Bucket4j) di endpoint auth

## Deliverables

1. **Backend project** (folder `backend/`):
   - Spring Boot project lengkap dengan struktur di atas
   - `pom.xml` dengan semua dependency
   - Flyway migration files untuk semua tabel
   - Sample data seeder (opsional, via SQL atau CommandLineRunner)
   - `README.md` cara run local (Docker Compose untuk Postgres)
   - `application-dev.yml` dan `application-prod.yml`

2. **Frontend project** (folder `frontend/`):
   - Vite + React + TS project
   - Semua page: Login, Register, Dashboard, Transactions, Accounts, Categories, Budgets, Reports, Settings
   - API client (axios) dengan interceptor untuk JWT + auto-refresh
   - `README.md` cara run local
   - `.env.example`

3. **Docker Compose** di root:
   - Postgres
   - Backend (Spring Boot)
   - Frontend (nginx serving build)

4. **Documentation** (`docs/`):
   - `ARCHITECTURE.md`: penjelasan struktur & alasan pilihan tech
   - `API.md`: contoh request/response tiap endpoint utama
   - `ADD_NEW_MODULE.md`: step-by-step cara nambah module baru (contoh: activity tracker)

## Constraints & Style
- **Clean code**: SOLID principles, meaningful naming, no magic numbers
- **DTO pattern**: jangan expose entity langsung ke API
- **Separation of concerns**: controller thin, service fat, repository queries only
- **No premature optimization**: pakai default JPA, index cuma kalau perlu
- **Comment**: hanya untuk business logic yang non-obvious, jangan comment yang obvious
- **Commit-able**: setiap file harus siap production, no TODO/FIXME tanpa alasan jelas

## Output Format
Berikan hasilnya bertahap:
1. **Tahap 1**: Struktur folder lengkap + file list
2. **Tahap 2**: Backend — auth module (entity, security config, endpoint register/login/refresh)
3. **Tahap 3**: Backend — finance module (accounts, categories, transactions, budgets)
4. **Tahap 4**: Frontend — setup + auth pages + protected route
5. **Tahap 5**: Frontend — dashboard + transactions page
6. **Tahap 6**: Frontend — sisanya (accounts, categories, budgets, reports)
7. **Tahap 7**: Docker Compose + README + docs

Tanya dulu di setiap tahap sebelum lanjut, biar aku bisa review.
