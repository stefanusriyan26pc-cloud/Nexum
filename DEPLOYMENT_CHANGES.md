# Perubahan untuk Deployment

## 🎯 Ringkasan Perubahan

Aplikasi sudah dipersiapkan untuk deployment terpisah antara:
- **Backend**: Koyeb (Express + Supabase)
- **Frontend**: Vercel (React + Vite)

---

## 📝 File yang Diubah

### 1. [src/lib/api.ts](src/lib/api.ts)
**Perubahan:** API base URL sekarang configurable via environment variable

```typescript
// SEBELUM:
const API_BASE = '/api';

// SESUDAH:
const API_BASE = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/api` 
  : '/api';
```

**Cara kerja:**
- Development (local): `VITE_API_BASE_URL` kosong → gunakan `/api` (relative path)
- Production (Vercel): `VITE_API_BASE_URL=https://nexus-api.koyeb.app` → gunakan `https://nexus-api.koyeb.app/api`

### 2. [src/pages/Finance.tsx](src/pages/Finance.tsx)
**Perubahan:** Exchange rates API endpoint menggunakan configurable base URL

```typescript
// SEBELUM:
const response = await fetch('/api/exchange-rates');

// SESUDAH:
const API_BASE = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/api` 
  : '/api';
const response = await fetch(`${API_BASE}/exchange-rates`);
```

### 3. [src/pages/auth/Register.tsx](src/pages/auth/Register.tsx)
**Perubahan:** Registration endpoint menggunakan configurable base URL

```typescript
// SEBELUM:
const res = await fetch('/api/auth/register', { ... });

// SESUDAH:
const API_BASE = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/api` 
  : '/api';
const res = await fetch(`${API_BASE}/auth/register`, { ... });
```

### 4. [src/pages/auth/Login.tsx](src/pages/auth/Login.tsx)
**Perubahan:** Login dan profile endpoints menggunakan configurable base URL

```typescript
// SEBELUM:
const res = await fetch('/api/auth/login', { ... });
void fetch('/api/profile', { ... });

// SESUDAH:
const API_BASE = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/api` 
  : '/api';
const res = await fetch(`${API_BASE}/auth/login`, { ... });
void fetch(`${API_BASE}/profile`, { ... });
```

---

## 🆕 File Baru

### 1. `.env.example`
Template untuk environment variables dengan semua konfigurasi yang diperlukan.

### 2. `DEPLOYMENT_GUIDE.md` (file ini)
Panduan lengkap deployment step-by-step untuk Koyeb dan Vercel.

---

## 🚀 Cara Menggunakan

### Skenario 1: Development (Local)
**Tidak perlu perubahan!** Aplikasi tetap berjalan seperti biasa:

```bash
npm run dev
```

Backend dan frontend di `http://localhost:3000`, API di `/api/*`

### Skenario 2: Deployment Monolith (Semua di Koyeb)

**Environment Variables di Koyeb:**
```bash
NODE_ENV=production
PORT=3000
APP_URL=https://your-app.koyeb.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key
GEMINI_API_KEY=your-key
CORS_ORIGINS=http://localhost:3000,https://your-app.koyeb.app
# JANGAN SET VITE_API_BASE_URL (biarkan kosong/hapus)
```

Frontend dan API di URL yang sama: `https://your-app.koyeb.app`

### Skenario 3: Deployment Terpisah (Backend: Koyeb, Frontend: Vercel) ⭐

**Environment Variables di Koyeb (Backend):**
```bash
NODE_ENV=production
PORT=3000
APP_URL=https://nexus-api.koyeb.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-key
CORS_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
```

**Environment Variables di Vercel (Frontend):**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://nexus-api.koyeb.app  # ⭐ INI PENTING!
GEMINI_API_KEY=your-key  # jika dipakai di frontend
```

Frontend di Vercel akan memanggil API ke Koyeb:
- Frontend: `https://your-app.vercel.app`
- API calls: `https://nexus-api.koyeb.app/api/*`

---

## ✅ Verifikasi

### Cek API Base URL di Browser Console

```javascript
// Buka browser console dan ketik:
console.log(import.meta.env.VITE_API_BASE_URL);

// Hasil yang diharapkan:
// - Development: undefined (gunakan relative path)
// - Vercel Production: "https://nexus-api.koyeb.app"
```

### Cek Network Requests

1. Buka Developer Tools (F12)
2. Tab Network
3. Login atau akses halaman
4. Lihat request ke API:
   - Development: `http://localhost:3000/api/...`
   - Vercel: `https://nexus-api.koyeb.app/api/...`

---

## 🔧 Troubleshooting

### API calls gagal dengan CORS error

**Solusi:**
1. Pastikan `CORS_ORIGINS` di backend include URL frontend Vercel
2. Format: `https://your-app.vercel.app` (dengan https, tanpa trailing slash)
3. Redeploy backend setelah update

### API calls ke localhost instead of Koyeb

**Solusi:**
1. Cek `VITE_API_BASE_URL` di Vercel environment variables
2. Pastikan tidak ada typo
3. Redeploy Vercel setelah update env vars
4. Hard refresh browser (Ctrl+Shift+R)

### Build error di Vercel

**Solusi:**
1. Pastikan semua `VITE_*` variables sudah diset
2. Cek build logs di Vercel dashboard
3. Test build locally: `npm run build`

---

## 📚 Dokumentasi Lengkap

Lihat [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) untuk:
- ✅ Step-by-step deployment ke Koyeb
- ✅ Step-by-step deployment ke Vercel
- ✅ Troubleshooting lengkap
- ✅ Testing & verification
- ✅ Update & redeploy workflow

---

## 🎉 Kesimpulan

Aplikasi sekarang **production-ready** dengan dukungan untuk:
- ✅ Development local (tidak perlu perubahan)
- ✅ Deployment monolith (semua di Koyeb)
- ✅ Deployment terpisah (Backend: Koyeb, Frontend: Vercel)

**Kode sudah siap deploy!** Tinggal ikuti langkah di `DEPLOYMENT_GUIDE.md` 🚀
