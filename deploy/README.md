# Deploy Duitku ke AWS (Free Tier)

Target arsitektur MVP:

```
Amplify Hosting (frontend, auto-deploy dari GitHub)
Elastic Beanstalk t3.micro (backend Spring Boot)
RDS PostgreSQL t3.micro (database)
```

Estimasi biaya: **$0/bulan** selama 12 bulan pertama (AWS Free Tier), ~$25/bulan setelahnya.

## 1. Database — RDS PostgreSQL

1. Login ke AWS Console, pastikan region di pojok kanan atas = **Asia Pacific (Singapore) `ap-southeast-1`** (harus sama dengan region EB di langkah 2 nanti — beda region = tidak bisa connect).
2. Search **RDS** di search bar atas → buka service RDS.
3. Sidebar kiri → **Databases** → tombol **Create database**.
4. **Choose a database creation method** → pilih **Standard create** (bukan *Easy create*, biar semua opsi di bawah bisa diatur manual).
5. **Engine options**:
   - Engine type: **PostgreSQL**
   - Engine version: pilih versi **16.x** terbaru yang tersedia (samain dengan Postgres lokal di `docker-compose.yml`).
6. **Templates** → pilih **Free tier** (ini otomatis mengunci beberapa pilihan supaya tetap gratis).
7. **Settings**:
   - DB instance identifier: `duitku-db`
   - Master username: `duitku`
   - Credentials management: **Self managed** → isi Master password (password kuat, beda dari password lokal `duitku`/`duitku` di docker-compose) → Confirm password. **Catat password ini di password manager** — AWS tidak akan menampilkannya lagi.
8. **Instance configuration** → pastikan yang terpilih `db.t3.micro` (burstable class, ini yang free tier eligible).
9. **Storage**:
   - Storage type: General Purpose SSD (gp2/gp3)
   - Allocated storage: `20` GiB
   - **Matikan** "Enable storage autoscaling" — biar tidak diam-diam nambah storage (dan biaya) di luar free tier.
10. **Connectivity**:
    - Compute resource: **Don't connect to an EC2 compute resource** (EB belum ada di tahap ini)
    - VPC: **Default VPC**
    - DB subnet group: default
    - Public access: **No** (lebih aman — nanti EB connect lewat security group di VPC yang sama, bukan lewat internet)
    - VPC security group: **Create new** → nama `duitku-rds-sg`
    - Availability Zone: No preference
    - Database port: `5432` (default)
11. **Database authentication** → **Password authentication** (default, jangan pilih IAM/Kerberos).
12. Expand **Additional configuration**:
    - **Initial database name**: `duitku` — ⚠️ ini wajib diisi, kalau kosong instance-nya jadi tapi database `duitku`-nya tidak otomatis ke-create.
    - Backup retention: default 7 hari sudah oke, boleh dikecilkan ke 1 hari kalau mau lebih hemat storage backup.
    - **Matikan** "Enable Performance Insights" untuk MVP $0/bulan.
13. Klik **Create database**. Tunggu ~5–10 menit sampai status berubah jadi **Available**.
14. Klik nama instance-nya → tab **Connectivity & security** → catat:
    - **Endpoint**, contoh: `duitku-db.xxxxxxxxxxxx.ap-southeast-1.rds.amazonaws.com`
    - **Port**: `5432`

    Ini dipakai sebagai `DB_URL=jdbc:postgresql://<endpoint>:5432/duitku` di langkah `eb setenv` (langkah 2.5).
15. **Setelah** environment EB dibuat di langkah 2: balik ke EC2 console → **Security Groups** → cari `duitku-rds-sg` → tab **Inbound rules** → **Edit inbound rules** → **Add rule**:
    - Type: **PostgreSQL** (otomatis isi port 5432)
    - Source: pilih **security group milik environment EB** (bukan `0.0.0.0/0` — jangan buka RDS ke seluruh internet)
    - Save rules.

**Biaya:** free tier RDS mencakup 750 jam/bulan `db.t3.micro` + 20GB storage + 20GB backup selama 12 bulan pertama. Setelah itu ~$12–15/bulan untuk instance ini saja.

## 2. Backend — Elastic Beanstalk

1. Install [EB CLI](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html).
2. Build jar-nya dulu secara lokal:
   ```bash
   cd backend
   mvn -q package -DskipTests
   ```
3. Dari root repo, inisialisasi EB (platform **Java 21**, region sesuai pilihan). `Procfile` dan `.ebextensions/` sudah ada di root repo — EB CLI otomatis membacanya dari sana:
   ```bash
   eb init duitku-backend --platform "Java 21" --region ap-southeast-1
   ```
4. Buat environment (`t3.micro`, single instance biar tetap di free tier):
   ```bash
   eb create duitku-backend-env --instance-type t3.micro --single
   ```
5. Set environment variables (jangan commit secrets ke `.ebextensions/options.config`):
   ```bash
   eb setenv \
     DB_URL=jdbc:postgresql://<rds-endpoint>:5432/duitku \
     DB_USERNAME=duitku \
     DB_PASSWORD=<password-rds> \
     JWT_SECRET=<random-32-byte-secret> \
     CORS_ALLOWED_ORIGIN=https://<domain-amplify-kamu> \
     COOKIE_SECURE=true \
     COOKIE_SAME_SITE=None
   ```
   `COOKIE_SECURE=true` + `COOKIE_SAME_SITE=None` **wajib** karena frontend (Amplify) dan backend (EB) ada di domain berbeda — browser tidak akan kirim refresh-token cookie di request cross-site kecuali `SameSite=None`, dan `SameSite=None` cuma valid kalau cookie-nya `Secure` (butuh HTTPS, lihat langkah 6). Tanpa ini, login akan terlihat berhasil tapi refresh-token gagal jalan dan user ke-logout sendiri.
6. Deploy:
   ```bash
   eb deploy
   ```
7. Catat URL environment-nya (`http://duitku-backend-env.xxxxx.elasticbeanstalk.com`) — dipakai frontend sebagai `VITE_API_BASE_URL`.

`Procfile` (root repo) sudah menentukan cara EB menjalankan jar-nya (`java -jar backend/target/*.jar` di port 5000, profile `prod`). Kalau file ini tidak ada persis di root — bukan di subfolder — EB akan diam-diam mengabaikannya dan environment gagal start.

### 2b. HTTPS untuk backend (wajib, bukan opsional)

EB single-instance defaultnya HTTP saja. Ini **bukan cuma soal keamanan** — dua hal di atas butuh HTTPS supaya jalan sama sekali:
- `Secure` cookie (langkah 5) tidak akan pernah terkirim balik ke server lewat HTTP.
- Amplify otomatis HTTPS, dan browser **memblokir** (bukan cuma warning) request fetch/XHR dari halaman HTTPS ke endpoint HTTP (mixed content).

**Opsi A — CloudFront** (idealnya, kalau akun AWS kamu sudah "verified"): taruh CloudFront di depan endpoint HTTP EB.

1. CloudFront → **Create distribution** → origin domain = URL EB dari langkah 7, origin protocol **HTTP only**, viewer protocol **Redirect HTTP to HTTPS**.
2. Cache policy **CachingDisabled**, origin request policy **AllViewer** (supaya cookie & header ikut ke-forward).
3. Domain CloudFront-nya (`https://dxxxxxxx.cloudfront.net`) otomatis dapat HTTPS, tidak perlu ACM/domain sendiri.

Catatan: akun AWS baru sering kena `AccessDenied: Your account must be verified before you can add new CloudFront resources` — kalau kejadian, harus buka tiket ke AWS Support dulu (gratis, tapi butuh waktu). Kalau lagi keburu, pakai Opsi B.

**Opsi B — API Gateway HTTP API** (dipakai di setup ini, tidak kena blokir verifikasi CloudFront, tidak perlu domain sendiri, gratis untuk trafik personal):

```bash
aws apigatewayv2 create-api \
  --name duitku-backend-proxy \
  --protocol-type HTTP \
  --target "http://<eb-domain-dari-langkah-7>" \
  --region ap-southeast-1
```
Command ini otomatis bikin API + integration (proxy transparan ke EB) + route + stage `$default` sekaligus, dan langsung live di `ApiEndpoint` yang dikembalikan (`https://<api-id>.execute-api.ap-southeast-1.amazonaws.com`) — itu dipakai sebagai base URL backend.

Verifikasi (opsi manapun yang dipakai):
```bash
curl https://<domain-https-backend>/actuator/health
# harus balas {"status":"UP"}
```

## 3. Frontend — AWS Amplify Hosting

1. Push repo ke GitHub (kalau belum).
2. Buka Amplify console → **New app** → **Host web app** → connect ke repo GitHub ini, pilih branch.
3. Amplify akan mendeteksi `deploy/aws-amplify.yml` — kalau tidak otomatis, set build settings manual sesuai isi file itu (root directory tetap repo root, `baseDirectory: frontend/dist`).
4. Set environment variable di Amplify console:
   - `VITE_API_BASE_URL` = `https://<domain-https-backend-dari-langkah-2b>/api/v1` (**jangan** domain EB langsung, harus HTTPS — via CloudFront atau API Gateway)
5. Deploy — Amplify otomatis build & publish tiap kali push ke branch yang dipilih.
6. Setelah dapat domain Amplify, balik ke langkah 2.5 dan update `CORS_ALLOWED_ORIGIN` di EB (`eb setenv CORS_ALLOWED_ORIGIN=https://<domain-amplify>`) biar match — tanpa ini, browser akan nolak response dari backend karena CORS mismatch.

## 4. CI/CD

**Frontend — tidak perlu setup tambahan.** Koneksi GitHub di langkah 3 Amplify sudah *jadi* CI/CD-nya: setiap push ke branch yang dipilih otomatis build + deploy. Tidak ada workflow file yang perlu ditulis.

**Backend — pakai GitHub Actions**, karena `eb deploy` manual tidak otomatis ke-trigger dari push. Workflow-nya sudah ada di [`.github/workflows/backend-deploy.yml`](../.github/workflows/backend-deploy.yml): setiap push ke `main` yang menyentuh `backend/**` akan build jar-nya, bungkus jadi zip (`Procfile` + `.ebextensions/` + jar, struktur yang sama seperti `eb deploy` manual), lalu deploy ke environment EB lewat action `einaregilsson/beanstalk-deploy`.

Yang perlu disiapkan sebelum workflow ini bisa jalan:

1. **Repo harus ada di GitHub** — project ini belum di-git-init. Push dulu sebelum workflow bisa trigger.
2. **IAM user khusus CI** (jangan pakai root/personal access key):
   - IAM console → **Create user** → programmatic access saja (access key, no console password).
   - Attach policy custom yang dibatasi ke Elastic Beanstalk + S3 bucket yang dipakai EB (bukan `AdministratorAccess`). Contoh minimal:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         { "Effect": "Allow", "Action": ["elasticbeanstalk:*"], "Resource": "*" },
         { "Effect": "Allow", "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket"], "Resource": [
           "arn:aws:s3:::elasticbeanstalk-*", "arn:aws:s3:::elasticbeanstalk-*/*"
         ]},
         { "Effect": "Allow", "Action": ["autoscaling:Describe*", "ec2:Describe*", "cloudformation:Describe*"], "Resource": "*" }
       ]
     }
     ```
3. **GitHub repo secrets** (Settings → Secrets and variables → Actions):
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
4. Kalau nama app/environment/region kamu beda dari default (`duitku-backend` / `duitku-backend-env` / `ap-southeast-1`), edit langsung di `.github/workflows/backend-deploy.yml`.

> **Catatan keamanan:** access key statis di atas paling gampang untuk MVP, tapi kalau mau lebih aman, upgrade ke [OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services) — GitHub Actions assume sebuah IAM role tanpa perlu menyimpan credential jangka panjang sama sekali. Butuh setup identity provider + trust policy sekali di IAM console, tapi lebih aman untuk jangka panjang.

## 5. Verifikasi

- Buka domain Amplify → coba register/login → refresh halaman, pastikan tetap login (ini yang membuktikan refresh-token cookie benar-benar terkirim cross-site, bukan cuma login awal yang sukses).
- DevTools → Application → Cookies → cek `duitku_refresh_token` punya `Secure` ✓ dan `SameSite=None`.
- Cek Swagger backend masih bisa diakses: `https://<domain-https-backend>/swagger-ui.html`.

## Catatan

- **HTTPS backend itu wajib**, bukan nice-to-have — lihat langkah 2b. Tanpa itu, cookie refresh-token tidak akan pernah terkirim balik ke server dan session tidak akan bertahan lebih dari satu request.
- **Scaling:** `eb create --single` = 1 instance tanpa load balancer, paling murah tapi tanpa auto-scaling. Cukup untuk pemakaian personal.
- **Secrets:** jangan pernah commit `JWT_SECRET` atau password DB ke repo — selalu lewat `eb setenv` / Amplify console env vars.
- **Same-origin alternative:** kalau kamu punya domain sendiri, taruh frontend di `app.domainmu.com` dan backend (lewat CloudFront) di `api.domainmu.com`. Keduanya jadi *same-site* (satu registrable domain), jadi `COOKIE_SAME_SITE=Lax` juga cukup — `None` tetap aman dipakai kalau mau, tapi tidak lagi wajib.
