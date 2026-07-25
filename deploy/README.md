# Deploy Duitku ke AWS (Free Tier)

Target arsitektur MVP:

```
Amplify Hosting (frontend, auto-deploy dari GitHub)
Elastic Beanstalk t3.micro (backend Spring Boot)
RDS PostgreSQL t3.micro (database)
```

Estimasi biaya: **$0/bulan** selama 12 bulan pertama (AWS Free Tier), ~$25/bulan setelahnya.

## 1. Database — RDS PostgreSQL

1. Buka RDS console → **Create database** → PostgreSQL, template **Free tier**.
2. Instance class `db.t3.micro`, storage 20GB.
3. Set master username/password (dipakai untuk `DB_USERNAME` / `DB_PASSWORD` nanti).
4. Setelah dibuat, catat endpoint-nya (`<db-id>.xxxxx.<region>.rds.amazonaws.com`).
5. Di security group RDS, izinkan inbound port 5432 dari security group Elastic Beanstalk (setup di langkah 2).

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

Cara termurah yang tetap masuk free tier: taruh **CloudFront** di depan endpoint HTTP EB, pakai sertifikat ACM gratis.

1. ACM (region **us-east-1**, wajib untuk CloudFront) → request certificate untuk domain backend kamu (atau pakai domain default CloudFront kalau belum punya domain sendiri).
2. CloudFront → **Create distribution** → origin domain = URL EB dari langkah 7 (`duitku-backend-env.xxxxx.elasticbeanstalk.com`), origin protocol **HTTP only**, viewer protocol **Redirect HTTP to HTTPS**.
3. Cache policy: pakai **CachingDisabled** (API tidak boleh di-cache) dan pastikan origin request policy meneruskan semua header, cookie, dan query string (`AllViewer`).
4. Setelah distribusi aktif, pakai domain CloudFront-nya (`https://dxxxxxxx.cloudfront.net`) sebagai base URL backend — ganti `VITE_API_BASE_URL` di Amplify dan `CORS_ALLOWED_ORIGIN` tetap ke domain Amplify.
5. Verifikasi: buka `https://dxxxxxxx.cloudfront.net/actuator/health` harus `{"status":"UP"}` lewat HTTPS.

## 3. Frontend — AWS Amplify Hosting

1. Push repo ke GitHub (kalau belum).
2. Buka Amplify console → **New app** → **Host web app** → connect ke repo GitHub ini, pilih branch.
3. Amplify akan mendeteksi `deploy/aws-amplify.yml` — kalau tidak otomatis, set build settings manual sesuai isi file itu (root directory tetap repo root, `baseDirectory: frontend/dist`).
4. Set environment variable di Amplify console:
   - `VITE_API_BASE_URL` = `https://<cloudfront-domain>/api/v1` (domain CloudFront dari langkah 2b — **jangan** domain EB langsung, harus HTTPS)
5. Deploy — Amplify otomatis build & publish tiap kali push ke branch yang dipilih.
6. Setelah dapat domain Amplify, balik ke langkah 2.5 dan update `CORS_ALLOWED_ORIGIN` di EB biar match.

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
- Cek Swagger backend masih bisa diakses: `https://<cloudfront-domain>/swagger-ui.html`.

## Catatan

- **HTTPS backend itu wajib**, bukan nice-to-have — lihat langkah 2b. Tanpa itu, cookie refresh-token tidak akan pernah terkirim balik ke server dan session tidak akan bertahan lebih dari satu request.
- **Scaling:** `eb create --single` = 1 instance tanpa load balancer, paling murah tapi tanpa auto-scaling. Cukup untuk pemakaian personal.
- **Secrets:** jangan pernah commit `JWT_SECRET` atau password DB ke repo — selalu lewat `eb setenv` / Amplify console env vars.
- **Same-origin alternative:** kalau kamu punya domain sendiri, taruh frontend di `app.domainmu.com` dan backend (lewat CloudFront) di `api.domainmu.com`. Keduanya jadi *same-site* (satu registrable domain), jadi `COOKIE_SAME_SITE=Lax` juga cukup — `None` tetap aman dipakai kalau mau, tapi tidak lagi wajib.
