# Prompt: Build Duitku — Personal Finance Web App (Full-Stack)

## Konteks

Aku mau bikin **Duitku**, personal finance web application. Aplikasi ini modular — nanti aku bakal nambah fitur lain (activity tracker, habit tracker, dll) tanpa refactor besar-besaran. Awalnya buat pemakaian pribadi tapi support multi-user via login/register.

**IMPORTANT — Reference visual:**
Ada file HTML mockup `duitku-dashboard.html` yang HARUS dijadikan reference persis untuk UI. Semua halaman (Dashboard, Transaksi, Laporan, Budget, Akun, Login, Register) sudah ada di sana. Bikin implementasi React yang **visual-nya identik dengan mockup itu** — same colors, same layout, same interactions, same responsive behavior. Jangan re-design. Baca mockup itu dulu sebelum coding.

---

## Tech Stack

### Backend
- **Framework:** Spring Boot 3.x + Java 21
- **Database:** PostgreSQL 16 (local dev via Docker), production-ready untuk AWS RDS
- **ORM:** Spring Data JPA + Hibernate
- **Auth:** Spring Security + JWT (access token 15 menit + refresh token 7 hari) + BCrypt
- **Validation:** Jakarta Bean Validation
- **API:** REST, JSON, versioning `/api/v1/...`
- **Documentation:** SpringDoc OpenAPI (Swagger UI) di `/swagger-ui.html`
- **Build:** Maven
- **Migration:** Flyway
- **Structured logging:** SLF4J + Logback JSON encoder
- **Testing:** SKIP — ga usah bikin unit test / integration test dulu

### Frontend
- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS 3 — pakai config yang sama persis dengan mockup (custom `brand` + `ink` color palette, Inter font)
- **UI icons:** `lucide-react` (nama icon sama dengan yang di mockup)
- **State management:** Zustand (untuk auth state, filter state)
- **Data fetching:** TanStack Query v5 (React Query) — semua API call via query hooks
- **Form:** React Hook Form + Zod validation
- **Router:** React Router v6 dengan protected routes
- **Charts:** Chart.js 4 + react-chartjs-2 (sama dengan mockup)
- **Date handling:** date-fns
- **HTTP client:** axios dengan interceptor JWT + auto-refresh
- **Currency formatting:** `Intl.NumberFormat('id-ID')` untuk Rupiah

---

## Design System (dari mockup — WAJIB IKUTI)

### Colors (Tailwind config)
```js
brand: {
  50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
  400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
  800: '#5b21b6', 900: '#4c1d95'
}
ink: {
  50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
  400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
  800: '#1e293b', 900: '#0f172a'
}
```
Semantic colors: `emerald-*` untuk positif/income, `rose-*` untuk negatif/expense, `amber-*` untuk warning.

### Typography
- Font: **Inter** (400, 500, 600, 700) dari Google Fonts
- Heading tracking: `tracking-tight`
- Weights: 500 untuk medium, 600 untuk semibold (headings)

### Component Patterns
- **Card:** `bg-white rounded-2xl border border-ink-200 p-5 lg:p-6 card-hover`
- **Card hover:** `transition-transform hover:-translate-y-0.5 hover:shadow-md`
- **Button primary:** `bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium rounded-xl px-4 py-2.5 shadow-sm`
- **Button secondary:** `border border-ink-200 hover:bg-ink-100 text-sm font-medium rounded-xl`
- **Input:** `border border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none`
- **Icon container:** `w-10 h-10 rounded-xl bg-{color}-100 flex items-center justify-center` dengan icon `w-5 h-5 text-{color}-600`
- **Hero gradient:** `bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900` untuk main balance card
- **Blur circles:** absolute positioned `bg-white/5 rounded-full blur-3xl` di hero cards

### Layout
- **Max width:** `max-w-6xl mx-auto`
- **Padding:** `px-4 md:px-6 lg:px-8 py-6 lg:py-8`
- **Grid gap:** `gap-3` (small) atau `gap-4` (large)
- **Sidebar width:** `md:w-16 lg:w-60` (collapse to icons on tablet)

### Responsive Breakpoints
- Mobile: default (bottom nav visible, sidebar hidden)
- Tablet: `md:` (sidebar shown as icon-only)
- Desktop: `lg:` (full sidebar with labels)

### Interactive Elements
- **Animations:** `.page` fadeIn on route change, `.animate-slideup` untuk modal
- **Loading messages:** localized Indonesian
- **Hover states:** subtle bg change (`hover:bg-ink-50` atau `hover:bg-ink-100`)
- **Focus rings:** `focus:ring-2 focus:ring-brand-500/20` (soft ring)

---

## Data Model

### `users`
- id (UUID), email (unique), password_hash, full_name, created_at, updated_at, email_verified

### `accounts` (rekening/dompet/investasi)
- id (UUID), user_id (FK), name, type (enum: BANK, EWALLET, CASH, INVESTMENT)
- current_balance (BigDecimal), currency (default IDR)
- for INVESTMENT: cost_basis (BigDecimal), current_value (BigDecimal, updated manually or via API)
- icon, color, account_number_masked, is_hidden (boolean)
- created_at, updated_at

### `categories`
- id (UUID), user_id (FK), name, kind (enum: INCOME, EXPENSE)
- icon (lucide name), color (tailwind color name)
- parent_id (nullable, untuk sub-kategori)
- is_default (boolean, ga bisa dihapus)

### `transactions`
- id (UUID), user_id (FK), type (enum: INCOME, EXPENSE, TRANSFER)
- amount (BigDecimal, always positive)
- occurred_at (timestamp), description, notes
- account_id (FK, sumber uang) — untuk INCOME dan EXPENSE
- from_account_id, to_account_id (FK) — khusus TRANSFER
- category_id (FK, nullable — TRANSFER ga wajib)
- fee (BigDecimal, default 0)
- fee_category_id (FK, nullable — kalau ada fee)
- tags (array of strings)
- is_recurring (boolean), recurrence_rule (RFC 5545 RRULE format, nullable)
- created_at, updated_at

**Constraint:** kalau type = TRANSFER, wajib ada from_account_id + to_account_id. Kalau ada fee, wajib fee_category_id. Kalau ada fee, buat transaction expense child otomatis (via service layer).

### `budgets`
- id (UUID), user_id (FK), category_id (FK), period (enum: WEEKLY, MONTHLY, YEARLY)
- amount (BigDecimal), start_date, end_date (nullable jika ongoing)
- created_at, updated_at

### `refresh_tokens`
- id, user_id, token_hash, expires_at, revoked, created_at

---

## API Endpoints (REST — semua di bawah `/api/v1`)

### Auth
- `POST /auth/register` → { email, password, full_name } → { user, access_token, refresh_token }
- `POST /auth/login` → { email, password } → { user, access_token, refresh_token }
- `POST /auth/refresh` → { refresh_token } → { access_token, refresh_token }
- `POST /auth/logout` → invalidate refresh token
- `GET /auth/me` → current user

### Accounts
- `GET /accounts` → list all (filter: `?type=BANK&hidden=false`)
- `POST /accounts` → create
- `GET /accounts/{id}` → detail
- `PATCH /accounts/{id}` → update
- `DELETE /accounts/{id}` → soft delete (kalau ada transaksi, jangan hard delete)
- `POST /accounts/{id}/hide` → toggle hide

### Categories
- `GET /categories` → list (filter: `?kind=EXPENSE`)
- `POST /categories`, `PATCH /categories/{id}`, `DELETE /categories/{id}`

### Transactions
- `GET /transactions` → paginated, filter: `?from=&to=&type=&account_id=&category_id=&search=&tag=&sort=&page=&size=`
- `POST /transactions` → create (handle fee auto-creation via service)
- `GET /transactions/{id}` → detail
- `PATCH /transactions/{id}` → update
- `DELETE /transactions/{id}`

### Budgets
- `GET /budgets` → list dengan progress (`{ budget, spent, remaining, pct, status }`)
- `POST /budgets`, `PATCH /budgets/{id}`, `DELETE /budgets/{id}`

### Reports (aggregate endpoints)
- `GET /reports/summary?from=&to=` → totals income, expense, savings, savings_rate, avg_per_day, tx_count
- `GET /reports/comparison?from=&to=&compare_from=&compare_to=` → per-category comparison
- `GET /reports/by-category?from=&to=` → breakdown per kategori
- `GET /reports/by-account?from=&to=` → breakdown per akun
- `GET /reports/top-merchants?from=&to=&limit=10` → top merchants
- `GET /reports/cashflow-trend?months=6` → data untuk line chart
- `GET /reports/insights` → auto-generated insights (rule-based dulu)

### Dashboard
- `GET /dashboard` → aggregate: net_worth, cash_total, investment_total (with gain%), monthly income/expense/savings, recent transactions (5), top categories (4), accounts summary

---

## Pages Spec (ikuti mockup)

### 1. Login (`/login`)
- Split screen: form (kiri) + brand gradient (kanan) di desktop
- Full form di mobile
- GitHub OAuth button (implement dengan Spring Security OAuth2 client + `spring-boot-starter-oauth2-client`)
- Email + password form
- Show/hide password toggle
- "Ingat saya 30 hari" checkbox
- "Lupa password?" link
- Link ke `/register`
- On success: store tokens (httpOnly cookie preferred, atau localStorage), redirect ke `/dashboard`

### 2. Register (`/register`)
- Sama layout dengan login
- Fields: nama lengkap, email, password (dengan strength indicator: weak/medium/strong/very-strong), confirm password
- Terms checkbox (wajib)
- Testimonial card di brand side
- On success: auto-login + redirect ke `/dashboard`

### 3. Dashboard (`/dashboard`) — halaman utama
- Greeting header dengan nama user + tanggal hari ini + tombol "Tambah transaksi"
- **Hero net worth card** (gradient brand): total kekayaan bersih + breakdown Cash vs Investasi (grid 2 col) + 3 stat mini (Pemasukan/Pengeluaran/Tabungan bulan ini)
- **Cashflow chart** (bar chart 6 bulan, income vs expense) — Chart.js
- **Top Categories** (list 4 kategori dengan progress bar)
- **Accounts list** dengan section terpisah untuk Cash/Bank dan Investasi (yang investasi ada gain badge)
- **Recent transactions** (5 terakhir) — clickable, link ke `/transactions`

### 4. Transactions (`/transactions`)
- Header: title + count + Export + Add button
- 4 summary cards (Pemasukan, Pengeluaran, Transfer, Rata-rata/hari) dengan comparison %
- Filter bar: search input + type chips (Semua/Pemasukan/Pengeluaran/Transfer) + date picker + advanced filter button
- Transaction list **grouped by date** (Hari ini / Kemarin / tanggal spesifik)
  - Each group: header dengan tanggal + total, list card di dalamnya
  - Each transaction: icon (with color per category), title, category · account · time
  - Amount di kanan (green untuk income, red untuk expense, ink untuk transfer)
  - Transfer: nested fee row dengan garis putus-putus di bawah
  - Transfer badge label
  - Recurring badge (kalau ada)
- "Muat lebih banyak" button (pagination)

### 5. Reports (`/reports`)
- Header: title + Print + Export dropdown
- Filter bar: period presets (Hari/Minggu/Bulan/3bln/6bln/Tahun/Semua/Custom) + type + akun + kategori + tag + reset
- 6 summary cards (Pemasukan, Pengeluaran, Net savings, Savings rate, Avg/hari, Transaksi) with vs-prev-period %
- Chart row: Trend cashflow (line, 3 datasets) + Category donut dengan center label
- Comparison table: kategori vs periode sebelumnya
- 2-col grid: Category breakdown (dengan progress bar) + Account breakdown + Top merchants
- **AI Insights card** (gradient brand-50): 4 auto-generated insight cards
- Full transaction table (sortable, columns: Tanggal, Deskripsi, Kategori, Akun, Jumlah) dengan pagination

### 6. Budget (`/budget`)
- Header: title + navigasi bulan (prev/current/next) + Set budget button
- **Overview card** (dark gradient): total budget vs actual, progress bar overall, target harian vs aktual harian
- Alert card kalau ada kategori over budget
- Budget cards grid (2 col di md+): masing-masing kategori punya progress bar, status color (emerald/amber/rose), sisa amount, days remaining
- **Card empty state** (dashed border) untuk tambah budget baru
- Tips card gradient di bawah (50/30/20 rule dll)

### 7. Accounts (`/accounts`)
- Header: title + count + total kekayaan + Tambah akun button
- 4 summary cards per tipe (Bank/E-wallet/Cash/Investasi)
- Filter tabs by type (Semua/Bank/E-wallet/Cash/Investasi) + Sembunyi filter
- **Grouped by type** dengan section header + total
- Each account card: icon large + nama + nomor mask, saldo besar, 2 quick stats, 3 action buttons di footer (Transaksi/Edit/Sembunyi atau Update/Edit/Detail untuk investasi)
- Investment accounts: gain badge + sub-card performa (1bln/6bln/YTD) + holdings breakdown (crypto)

### 8. Add Transaction Modal
- Fixed overlay, bottom sheet di mobile, centered card di desktop
- Header + close button
- Type tabs: Pemasukan / Pengeluaran / Transfer (with icons, pill style)
- Amount input besar (auto-format Rupiah)
- For Transfer: From/To account selectors (button dengan icon + nama + saldo)
- For Income/Expense: Account selector + Category selector
- **Fee toggle** (untuk Transfer): kalau ON → fee amount input + fee category selector
- Date picker + Notes input
- **Live preview card**: nunjukin efek per akun + efek ke net worth (recalculate on input change)
- Footer: Batal + Simpan buttons

---

## Behavior & Business Logic

### Fee Handling (WAJIB implement dengan benar)
- Saat user create transaction dengan fee, service layer harus:
  1. Create main transaction (type=TRANSFER, amount=X)
  2. Auto-create separate EXPENSE transaction (amount=fee, account=from_account, category=fee_category)
  3. Both dalam satu database transaction (atomic)
  4. Return list of both transactions
- Di transaction list, fee ditampilkan **nested** di bawah main transfer (visual grouping)

### Transfer Logic
- Transfer TIDAK mengubah net worth (cuma pindah antar akun)
- Investment purchase = transfer dari bank ke investment account
- Balance calculation:
  - INCOME: `account.balance += amount`
  - EXPENSE: `account.balance -= amount`
  - TRANSFER: `from_account.balance -= amount`, `to_account.balance += amount`
  - Fee (auto expense): `account.balance -= fee`

### Investment Gain/Loss
- Manual update dulu (user input current_value)
- Gain = current_value - cost_basis, gain% = (gain / cost_basis) * 100
- Show di dashboard hero, accounts page, dan reports

### Budget Calculation
- Query all transactions in current budget period (month/week/year)
- Sum by category
- Calculate: spent, remaining (budget.amount - spent), pct (spent/budget.amount * 100)
- Status: 
  - `on_track` if pct <= 75%
  - `warning` if 75% < pct <= 100%
  - `over` if pct > 100%
- Include days_remaining sampai akhir period

### Insights (rule-based di v1)
Generate insights based on data patterns:
- Savings rate tinggi/rendah vs benchmark 25%
- Category spending naik >20% vs bulan lalu → warning
- Fee bank total > Rp 20k/bulan → saran BI-Fast
- Investment beat/underperform IHSG (kalau ada data reference)

---

## Auth Flow

1. **Register/Login** → backend return `{ user, access_token (15m), refresh_token (7d) }`
   - Email/password flow: form biasa
   - **GitHub OAuth flow**: klik tombol GitHub → redirect ke `GET /oauth2/authorization/github` (Spring Security) → GitHub authorize → callback ke `GET /login/oauth2/code/github` → backend auto-create/link user (by email) → issue JWT tokens → redirect frontend ke `/oauth-callback?token=xxx` yang extract token dan simpan
   - Config: `application.yml` → `spring.security.oauth2.client.registration.github.{client-id,client-secret}` dari env vars
   - Backend: implement `OAuth2UserService` custom yang handle GitHub user info + create/link ke tabel `users`
   - Table `users` tambah kolom: `oauth_provider` (nullable: 'github'), `oauth_provider_id` (nullable, unique per provider)
2. Frontend store:
   - `access_token` in memory (Zustand store) atau sessionStorage
   - `refresh_token` in httpOnly cookie (via backend Set-Cookie) — prefer this
3. Axios interceptor: attach `Authorization: Bearer {access_token}` di setiap request
4. Response interceptor: kalau 401 → call `/auth/refresh` → retry request; kalau refresh gagal → redirect ke `/login`
5. Logout: call `/auth/logout` → clear tokens → redirect `/login`
6. Protected routes: React Router guard yang cek auth state, redirect `/login` kalau ga ada token

**Every user data query MUST filter by `user_id` from JWT.** Row-level isolation di service layer, jangan bergantung ke frontend.

---

## Project Structure

### Backend (`backend/`)
```
src/main/java/com/duitku/app/
├── DuitkuApplication.java
├── common/
│   ├── config/         # SecurityConfig, JwtConfig, CorsConfig, OpenApiConfig
│   ├── exception/      # GlobalExceptionHandler, custom exceptions
│   ├── security/       # JwtAuthenticationFilter, JwtService, UserDetailsServiceImpl
│   ├── util/           # DateUtils, IdGenerator
│   └── dto/            # ErrorResponse, PageResponse<T>
├── auth/
│   ├── AuthController, AuthService, RefreshTokenService
│   ├── dto/            # RegisterRequest, LoginRequest, TokenResponse
│   └── entity/         # User, RefreshToken
├── finance/
│   ├── account/        # AccountController, Service, Repository, Entity, Dto, Mapper
│   ├── category/       # same pattern
│   ├── transaction/    # TransactionController, Service (with fee logic), etc
│   ├── budget/
│   └── report/         # ReportController, ReportService (aggregate queries)
└── dashboard/
    └── DashboardController, DashboardService

src/main/resources/
├── application.yml, application-dev.yml, application-prod.yml
└── db/migration/       # Flyway: V1__users.sql, V2__accounts.sql, ...
```

### Frontend (`frontend/`)
```
src/
├── main.tsx, App.tsx
├── lib/
│   ├── api.ts          # axios instance dengan interceptors
│   ├── auth.ts         # Zustand auth store
│   ├── currency.ts     # formatIDR helper
│   └── date.ts         # date formatting helpers
├── components/
│   ├── ui/             # Button, Input, Card, Modal, Badge, ProgressBar (semua ikut mockup style)
│   ├── layout/         # AppShell, Sidebar, BottomNav, Header
│   └── charts/         # CashflowChart, CategoryDonut, TrendLine
├── features/
│   ├── auth/           # LoginPage, RegisterPage, useAuth
│   ├── dashboard/      # DashboardPage, HeroBalance, TopCategories, RecentTransactions
│   ├── transactions/   # TransactionsPage, TransactionList, TransactionCard, AddTransactionModal
│   ├── accounts/       # AccountsPage, AccountCard, AccountGroup
│   ├── budget/         # BudgetPage, BudgetCard, BudgetOverview
│   └── reports/        # ReportsPage, FilterBar, SummaryCards, InsightsCard
├── routes/
│   └── protected.tsx   # ProtectedRoute wrapper
└── styles/
    └── index.css       # Tailwind directives + Inter font import
```

### Root
- `docker-compose.yml`: Postgres 16 + backend + frontend (nginx)
- `README.md`: quickstart
- `.env.example` di frontend dan backend

---

## Deployment (Target: AWS Free Tier)

### Architecture
```
Route 53 → CloudFront → S3 (frontend build)
                     → API Gateway → Lambda (Spring Boot via SnapStart) → RDS PostgreSQL (t3.micro)
                                  → Cognito (opsional untuk auth, atau JWT sendiri)
```

Alternatif simpler (untuk MVP):
- Frontend: **AWS Amplify Hosting** (auto-deploy dari GitHub)
- Backend: **Elastic Beanstalk** dengan t3.micro EC2 + RDS Postgres t3.micro
- Estimated cost: **$0/bulan** dalam 12 bulan free tier, ~$25/bulan after

Provide:
- `deploy/aws-amplify.yml` untuk frontend
- `deploy/elasticbeanstalk/` config untuk backend
- `deploy/README.md` step-by-step deployment guide

---

## Non-Functional Requirements

- **Responsive:** Test di 375px (mobile), 768px (tablet), 1280px (laptop), 1920px (desktop)
- **Performance:** Frontend Lighthouse score ≥ 90 (Performance, Accessibility)
- **Accessibility:** Keyboard navigation, ARIA labels, focus rings visible
- **Error handling:** Global error boundary di React; error toasts (bukan modal)
- **Loading states:** Skeleton components (bukan spinners kosong)
- **Empty states:** Illustrated dengan CTA (contoh: "Belum ada transaksi. Tambah yang pertama.")
- **Currency:** Format Rupiah `Rp 1.234.567` (thousand separator titik, tanpa desimal)
- **Timezone:** WIB (Asia/Jakarta), store UTC di DB

---

## Delivery Plan (Bertahap — tanya konfirmasi di setiap tahap)

### Tahap 1 — Foundation
- Backend: Spring Boot skeleton + auth module (register/login/refresh/me) + JWT + Flyway users table
- Frontend: Vite + React + Tailwind + auth pages (Login/Register) — persis mockup, functional dengan real backend
- Docker Compose: postgres + backend runnable
- Verifikasi manual: bisa register → login → dapat token (test lewat curl/Postman/Swagger UI, ga perlu automated test)

### Tahap 2 — Accounts & Categories
- Backend: Accounts CRUD + Categories CRUD + seed default categories
- Frontend: Accounts page (persis mockup) — functional dengan real data

### Tahap 3 — Transactions (Core)
- Backend: Transactions CRUD dengan fee auto-creation logic + balance recalculation
- Frontend: Transactions page + Add Transaction modal (persis mockup) — semua tipe (income/expense/transfer + fee)

### Tahap 4 — Dashboard & Budget
- Backend: Dashboard endpoint (aggregate) + Budgets CRUD
- Frontend: Dashboard page + Budget page (persis mockup)

### Tahap 5 — Reports & Insights
- Backend: Report endpoints (summary, comparison, by-category, cashflow-trend, insights)
- Frontend: Reports page (persis mockup) dengan semua chart & filter

### Tahap 6 — Polish & Deploy
- Loading states, error handling, empty states
- Docker Compose complete
- AWS deployment (Amplify + Beanstalk)
- README + API docs

---

## Instruksi Penting

1. **Baca `duitku-dashboard.html` dulu** sebelum mulai coding frontend. Ambil semua className, layout, spacing, color, animation dari sana.
2. **Jangan pakai UI library besar** (Material UI, Chakra, Ant Design) — pakai Tailwind langsung + custom component ringan biar match mockup.
3. **Tanya kalau ambigu**, jangan asumsi.
4. **Konfirmasi di setiap tahap** sebelum lanjut.
5. **Clean code:** SOLID, DTO pattern, thin controller / fat service, meaningful naming, no magic number.
6. **Format Rupiah konsisten:** pakai helper `formatIDR()` di frontend dan `RupiahFormatter` di backend.
7. **UI fidelity > kecepatan.** Kalau ada trade-off, prioritas match mockup.
8. **Skip semua testing code** — ga usah bikin unit test, integration test, atau e2e test. Fokus ke functional implementation aja.

---

## Output Format

Setelah baca prompt ini + mockup HTML, kasih ringkasan:
1. Konfirmasi kamu udah baca mockup HTML dan paham design system-nya
2. Question kalau ada yang unclear
3. Setelah OK, mulai **Tahap 1** dan tunggu approval sebelum lanjut tahap berikutnya
