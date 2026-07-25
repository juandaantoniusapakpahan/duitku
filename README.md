# Duitku — Personal Finance

Aplikasi keuangan pribadi: tracking transaksi (income/expense/transfer + fee otomatis), multi-akun (bank/e-wallet/cash/investasi), budget per kategori, dan laporan dengan insight rule-based.

## Tech Stack

- **Backend:** Spring Boot 3 (Java 21), PostgreSQL 16, Flyway, Spring Security + JWT
- **Frontend:** React 18 + Vite + TypeScript, Tailwind CSS, TanStack Query, Zustand, Chart.js

## Quickstart (Dev)

Butuh: Java 21, Maven, Node 18+, Docker.

1. **Database** — start Postgres via Docker:

```bash
docker compose up -d postgres
```

2. **Backend** — jalan di `http://localhost:8080`, migrasi Flyway otomatis saat start:

```bash
cd backend
cp .env.example .env   # opsional, default sudah cocok buat dev
mvn spring-boot:run
```

Swagger UI: `http://localhost:8080/swagger-ui.html`

3. **Frontend** — jalan di `http://localhost:5173`:

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

4. Buka `http://localhost:5173`, daftar akun baru (kategori default otomatis di-seed), lalu mulai tambah akun & transaksi.

## Full Docker (opsional)

Untuk menjalankan semua service (Postgres + backend + frontend) di container sekaligus, mirip environment production:

```bash
docker compose --profile full up -d --build
```

Frontend akan tersedia di `http://localhost:5173`, backend di `http://localhost:8080`.

## Struktur Proyek

```
backend/    Spring Boot API (lihat backend/src/main/java/com/duitku/app)
frontend/   React app (lihat frontend/src)
docs/       Spec, mockup, design docs, implementation plans
deploy/     Config & panduan deployment ke AWS
```

## Environment Variables

Lihat `backend/.env.example` dan `frontend/.env.example`.

## Deployment

Lihat [deploy/README.md](deploy/README.md) untuk panduan deploy ke AWS (Amplify + Elastic Beanstalk, free-tier friendly).
