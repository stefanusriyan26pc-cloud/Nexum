# Panduan Deployment Nexus PM Tool

Guide lengkap untuk deploy aplikasi Nexus ke **Koyeb** (Backend) dan **Vercel** (Frontend).

## 📋 Persiapan

### 1. Cek File .env (Keamanan)

Pastikan `.env` **TIDAK** di-commit ke GitHub:

```bash
# Cek apakah .env ada di .gitignore
cat .gitignore | grep .env
```

Jika `.env` belum ada di `.gitignore`, tambahkan:
```bash
echo ".env" >> .gitignore
```

Jika `.env` sudah ter-commit sebelumnya, hapus dari history:
```bash
git rm --cached .env
git add .gitignore
git commit -m "Remove .env from version control"
git push
```

### 2. Siapkan Environment Variables

Gunakan file `.env.example` sebagai template. Siapkan nilai-nilai berikut:

- `SUPABASE_URL` - URL project Supabase Anda
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key dari Supabase
- `VITE_SUPABASE_URL` - Same as SUPABASE_URL (untuk frontend)
- `VITE_SUPABASE_ANON_KEY` - Anonymous key dari Supabase
- `GEMINI_API_KEY` - API key dari Google Gemini (opsional)

---

## 🚀 Deployment Strategi

Ada 2 pilihan deployment:

### Opsi A: Monolith di Koyeb (Backend + Frontend)
Backend dan frontend dalam satu deployment. Cocok untuk kesederhanaan.

### Opsi B: Terpisah (Backend: Koyeb, Frontend: Vercel) ⭐ Recommended
Backend di Koyeb, frontend di Vercel. Lebih scalable dan mengoptimalkan masing-masing platform.

---

## 🔵 Opsi A: Deployment Monolith ke Koyeb

### Langkah 1: Push ke GitHub

```bash
git add .
git commit -m "Prepare for Koyeb deployment"
git push origin main
```

### Langkah 2: Setup di Koyeb

1. Buka [koyeb.com](https://www.koyeb.com) dan login
2. Klik **Create App**
3. Pilih **GitHub** sebagai source
4. Pilih repository `nexus-PMtool`
5. Branch: `main`

### Langkah 3: Konfigurasi Build

**Builder:** Buildpack

**Build command:**
```bash
npm install
npm run build
```

**Run command:**
```bash
npm run start
```

**Runtime:** Node 20

### Langkah 4: Environment Variables

Di tab **Environment**, tambahkan:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `APP_URL` | `https://NAMA-APP.koyeb.app` (sesuaikan nanti) |
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` |
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-key` |
| `GEMINI_API_KEY` | `your-gemini-key` (opsional) |
| `CORS_ORIGINS` | `http://localhost:3000,https://NAMA-APP.koyeb.app` |

⚠️ **Note:** Kosongkan atau hapus `VITE_API_BASE_URL` untuk deployment monolith.

### Langkah 5: Deploy

1. Klik **Deploy**
2. Tunggu build selesai (~2-5 menit)
3. Dapatkan URL deployment (contoh: `https://nexus-api.koyeb.app`)
4. **Update** environment variable `APP_URL` dengan URL yang sebenarnya
5. **Update** `CORS_ORIGINS` untuk include URL deployment
6. Redeploy jika perlu

### Langkah 6: Verifikasi

Buka URL Koyeb Anda dan pastikan aplikasi berjalan:
- Frontend: `https://your-app.koyeb.app`
- API Health: `https://your-app.koyeb.app/api/health`

---

## 🟢 Opsi B: Deployment Terpisah (Koyeb + Vercel) ⭐

### Bagian 1: Deploy Backend ke Koyeb

#### Langkah 1: Push ke GitHub

```bash
git add .
git commit -m "Prepare for separate deployment"
git push origin main
```

#### Langkah 2: Setup di Koyeb

1. Buka [koyeb.com](https://www.koyeb.com) dan login
2. Klik **Create App**
3. Pilih **GitHub** sebagai source
4. Pilih repository `nexus-PMtool`
5. Branch: `main`
6. App name: Misalnya `nexus-api` atau `nexus-backend`

#### Langkah 3: Konfigurasi Build

**Builder:** Buildpack

**Build command:**
```bash
npm install
npm run build
```

**Run command:**
```bash
npm run start
```

**Runtime:** Node 20

#### Langkah 4: Environment Variables - Backend (Koyeb)

| Variable | Value | Catatan |
|----------|-------|---------|
| `NODE_ENV` | `production` | - |
| `PORT` | `3000` | - |
| `APP_URL` | `https://nexus-api.koyeb.app` | Sesuaikan dengan nama app |
| `SUPABASE_URL` | `https://your-project.supabase.co` | Dari Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` | **Secret!** Dari Supabase |
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Untuk build frontend assets |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-key` | Dari Supabase |
| `GEMINI_API_KEY` | `your-gemini-key` | Opsional |
| `CORS_ORIGINS` | `http://localhost:3000,https://your-frontend.vercel.app` | Update setelah deploy Vercel |

#### Langkah 5: Deploy Backend

1. Klik **Deploy**
2. Tunggu build selesai
3. **Catat URL backend** (contoh: `https://nexus-api.koyeb.app`)
4. Test API health: `https://nexus-api.koyeb.app/api/health`

---

### Bagian 2: Deploy Frontend ke Vercel

#### Langkah 1: Setup di Vercel

1. Buka [vercel.com](https://vercel.com) dan login
2. Klik **Add New Project**
3. Pilih **Import Git Repository**
4. Pilih repository `nexus-PMtool` yang sama
5. Framework Preset: **Vite** (auto-detected)

#### Langkah 2: Konfigurasi Build - Vercel

**Build Command:** (Default sudah benar)
```bash
npm run build
```

**Output Directory:** (Default sudah benar)
```
dist
```

**Install Command:** (Default)
```bash
npm install
```

#### Langkah 3: Environment Variables - Frontend (Vercel)

| Variable | Value | Catatan |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Dari Supabase |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-key` | Dari Supabase |
| `VITE_API_BASE_URL` | `https://nexus-api.koyeb.app` | **URL backend dari Koyeb** |
| `GEMINI_API_KEY` | `your-gemini-key` | Jika dipakai di frontend (opsional) |

⚠️ **Penting:** `VITE_API_BASE_URL` harus berisi URL backend Koyeb tanpa trailing slash.

#### Langkah 4: Deploy Frontend

1. Klik **Deploy**
2. Tunggu build selesai (~1-2 menit)
3. **Catat URL frontend** (contoh: `https://nexus-pmtool.vercel.app`)

#### Langkah 5: Update CORS di Backend

Kembali ke **Koyeb dashboard**:

1. Buka app backend Anda
2. Settings → Environment Variables
3. Update `CORS_ORIGINS`:
   ```
   http://localhost:3000,https://nexus-pmtool.vercel.app
   ```
4. Redeploy backend (biasanya otomatis)

#### Langkah 6: Verifikasi

1. Buka frontend: `https://your-frontend.vercel.app`
2. Cek browser console untuk error
3. Test login dan API calls
4. Verify di Network tab bahwa API calls mengarah ke Koyeb

---

## ✅ Testing & Verification

### 1. Health Check

Backend health endpoint:
```bash
curl https://your-backend.koyeb.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-03T...",
  "env": "production",
  "db": "supabase"
}
```

### 2. Test API Endpoints

Test projects endpoint:
```bash
curl https://your-backend.koyeb.app/api/projects
```

### 3. Test Frontend

1. Buka aplikasi di browser
2. Buka Developer Tools (F12)
3. Tab Network → Filter XHR
4. Login dan navigasi
5. Pastikan requests ke backend berhasil (status 200)

### 4. Test CORS

Pastikan tidak ada CORS errors di console. Jika ada:
- Cek `CORS_ORIGINS` di backend
- Pastikan include URL frontend yang tepat
- Redeploy backend setelah update

---

## 🔧 Troubleshooting

### Problem: API calls failed / Network error

**Solution:**
1. Cek `VITE_API_BASE_URL` di Vercel environment variables
2. Pastikan URL backend correct dan accessible
3. Cek CORS settings di backend

### Problem: "Origin not allowed" CORS error

**Solution:**
1. Update `CORS_ORIGINS` di backend (Koyeb)
2. Format yang benar: comma-separated, no spaces
3. Include protocol (https://)
4. Redeploy backend

### Problem: Supabase connection failed

**Solution:**
1. Verify `SUPABASE_URL` dan keys
2. Cek Supabase dashboard for service status
3. Pastikan service role key ada di backend
4. Pastikan anon key ada di frontend

### Problem: 404 on page refresh (Vercel)

**Solution:**
Vercel should handle this automatically for Vite apps. If not:
- Check `vercel.json` for rewrite rules (biasanya tidak perlu)

### Problem: Environment variables not working

**Solution:**
1. Pastikan prefix `VITE_` untuk frontend variables
2. Redeploy setelah mengubah env vars
3. Hard refresh browser (Ctrl+Shift+R)

---

## 🔄 Update & Redeploy

### Update Kode

```bash
git add .
git commit -m "Your update message"
git push origin main
```

- **Koyeb:** Auto-deploy dari GitHub push (jika enabled)
- **Vercel:** Auto-deploy dari GitHub push

### Update Environment Variables

**Koyeb:**
1. Dashboard → App → Settings → Environment
2. Update values
3. Redeploy (biasanya otomatis)

**Vercel:**
1. Dashboard → Project → Settings → Environment Variables
2. Update values
3. Redeploy (Deployments → latest → Redeploy)

---

## 📊 Monitoring

### Koyeb

- Dashboard: Lihat logs, metrics, status
- Logs: Check untuk errors

### Vercel

- Dashboard: Lihat deployment status dan logs
- Analytics: Monitor performance (available on Pro plan)

### Supabase

- Dashboard → Database → Monitor queries
- Auth → Monitor user activities
- API → Monitor request volume

---

## 💰 Cost Considerations

### Koyeb Free Tier

- ✅ 1 web service
- ✅ Shared CPU
- ⚠️ Auto-sleep after inactivity (cold starts)

### Vercel Free Tier (Hobby)

- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ No sleep (always on)

### Supabase Free Tier

- ✅ 500MB database
- ✅ 50MB file storage  
- ✅ 50,000 monthly active users

---

## 🎯 Next Steps

Setelah deployment sukses:

1. ✅ Setup custom domain (opsional)
2. ✅ Enable HTTPS (otomatis di Koyeb & Vercel)
3. ✅ Setup monitoring/alerting
4. ✅ Configure backup strategy
5. ✅ Setup CI/CD pipelines (otomatis via GitHub)
6. ✅ Add production error tracking (Sentry, LogRocket, dll)

---

## 📝 Notes

- **Kode sudah siap:** File API telah di-update untuk support deployment terpisah
- **Environment variables:** Gunakan `VITE_API_BASE_URL` untuk switch antara dev dan production
- **Development:** Jalankan `npm run dev` untuk local development (backend + frontend)
- **Production:** Backend di Koyeb serve API + static files, atau frontend terpisah di Vercel

---

## 📞 Support

Jika ada masalah:
1. Cek section Troubleshooting di atas
2. Review logs di Koyeb/Vercel dashboard
3. Verify environment variables
4. Test API endpoints secara manual dengan curl

Happy Deploying! 🚀
