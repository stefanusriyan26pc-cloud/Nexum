# 🚀 Panduan Deploy ke GitHub & Netlify

## ✅ Status Saat Ini
- ✅ Git repository sudah diinisialisasi
- ✅ Remote GitHub sudah terkonfigurasi: `stefanusriyan26pc-cloud/Nexum`
- ✅ `.gitignore` sudah melindungi file sensitif
- ✅ Netlify configuration telah dibuat

---

## 📤 LANGKAH 1: Push ke GitHub

Repository sudah terhubung ke GitHub. Untuk push perubahan terbaru:

```bash
cd /Users/calculus/Documents/Me-Project/nexus-PMtool

# Cek status file yang berubah
git status

# Tambahkan file baru (netlify.toml, dll)
git add .

# Commit perubahan
git commit -m "Add Netlify configuration"

# Push ke GitHub
git push origin main
```

**Note:** Saat `git push`, GitHub akan meminta:
- Username GitHub kamu
- Personal Access Token (bukan password biasa)

### Cara Buat Personal Access Token:
1. Buka: https://github.com/settings/tokens
2. "Generate new token" → "Generate new token (classic)"
3. Pilih scope: `repo` (full access to repositories)
4. Copy token dan gunakan sebagai password saat git push

---

## 🌐 LANGKAH 2: Deploy Frontend ke Netlify

### A. Setup Awal Netlify

1. **Buka Netlify Dashboard:** https://app.netlify.com
2. **Add new site** → **Import an existing project**
3. **Connect to Git provider** → Pilih **GitHub**
4. **Authorize Netlify** untuk akses repository
5. **Pilih repository:** `stefanusriyan26pc-cloud/Nexum`

### B. Build Settings

Netlify akan auto-detect settings dari `netlify.toml`, tapi pastikan:

```
Build command: pnpm install && pnpm run build
Publish directory: dist
```

### C. Environment Variables

Klik **Site settings** → **Environment variables** → **Add a variable**

Tambahkan variabel berikut (dapatkan dari Supabase Dashboard):

| Variable Name | Value | Where to Get |
|--------------|-------|--------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase → Settings → API → anon public key |
| `GEMINI_API_KEY` | `AIzaSy...` | (Opsional) Google AI Studio |

**PENTING:** 
- Jangan gunakan `SUPABASE_SERVICE_ROLE_KEY` di frontend!
- Hanya `anon key` yang aman untuk frontend

### D. Deploy!

1. Klik **Deploy site**
2. Tunggu build selesai (~2-3 menit)
3. Dapatkan URL: `https://nama-site-kamu.netlify.app`

---

## 🔄 Update Site (Setelah Deploy Pertama)

Setiap kali push ke GitHub, Netlify akan otomatis rebuild:

```bash
# Lakukan perubahan pada code
# ...

git add .
git commit -m "Update feature xxx"
git push origin main

# Netlify akan otomatis deploy!
```

---

## 🎯 LANGKAH 3: Apa yang Sudah Jalan di Netlify?

### ✅ Yang Langsung Jalan:
- ✅ Frontend Vite React/TypeScript
- ✅ Routing (React Router)
- ✅ Supabase Auth (Login/Register)
- ✅ Supabase Database queries langsung dari client
- ✅ UI/UX lengkap
- ✅ Static assets (images, fonts, dll)

### ⚠ Yang BELUM Jalan (Butuh Migrasi):
- ❌ Endpoint `/api/projects` (dari Express server.ts)
- ❌ Endpoint `/api/tasks`
- ❌ Endpoint `/api/transactions`
- ❌ Endpoint `/api/analytics`
- ❌ Semua API routes lainnya di server.ts

**Mengapa?** 
Karena `server.ts` adalah Express server tradisional yang butuh server always-on. Netlify hanya support **serverless functions**.

---

## 🛠 LANGKAH 4: Migrasi Backend ke Netlify Functions

### Opsi A: Direct Supabase Calls (Paling Mudah)

Jika API routes di `server.ts` hanya proxy ke Supabase, lebih baik frontend langsung call Supabase:

**Contoh sekarang:**
```typescript
// Frontend memanggil Express API
fetch('/api/projects')
  ↓
// server.ts route
app.get('/api/projects', async (req, res) => {
  const { data } = await supabase.from('projects').select('*');
  res.json(data);
});
```

**Ubah jadi:**
```typescript
// Frontend langsung ke Supabase
import { supabase } from '@/lib/supabaseBrowser';

const { data } = await supabase
  .from('projects')
  .select('*');
```

**Keuntungan:**
- ✅ Tidak perlu backend sama sekali
- ✅ Real-time subscriptions built-in
- ✅ Row Level Security (RLS) untuk security
- ✅ Lebih cepat (no middle layer)

### Opsi B: Netlify Functions (Jika Butuh Logic Kompleks)

Jika ada business logic kompleks, buat Netlify Function:

**1. Struktur Folder:**
```
netlify/
  functions/
    projects.ts
    tasks.ts
    analytics.ts
```

**2. Contoh Function:**
```typescript
// netlify/functions/projects.ts
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

export const handler: Handler = async (event) => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Aman di server
  );
  
  if (event.httpMethod === 'GET') {
    const { data, error } = await supabase
      .from('projects')
      .select('*');
      
    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  }
  
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
```

**3. Update Frontend:**
```typescript
// Ubah dari: /api/projects
// Jadi: /.netlify/functions/projects

const response = await fetch('/.netlify/functions/projects');
const data = await response.json();
```

**4. Environment Variables di Netlify:**
Tambahkan `SUPABASE_SERVICE_ROLE_KEY` untuk functions (ini aman karena jalan di server Netlify, bukan di browser).

---

## 📋 Rekomendasi Langkah Selanjutnya

### Immediate (Lakukan Sekarang):
1. ✅ Push ke GitHub dengan config Netlify
2. ✅ Deploy frontend ke Netlify
3. ✅ Test login/register (harusnya langsung jalan karena Supabase client-side)

### Short Term (Minggu Ini):
1. Audit file di `src/lib/api.ts` - lihat endpoint mana yang dipanggil
2. Untuk setiap endpoint sederhana, ganti dengan direct Supabase call
3. Document endpoint mana yang butuh logic kompleks

### Medium Term (Kalau Perlu):
1. Buat Netlify Functions untuk endpoint yang butuh server logic
2. Migrate satu-satu dari Express ke Functions
3. Update frontend untuk call Functions

---

## 🆘 Troubleshooting

### Build Gagal di Netlify?
- Check error log di Netlify dashboard
- Pastikan environment variables sudah di-set
- Coba build lokal: `pnpm run build`

### Login/Register Tidak Jalan?
- Cek Supabase URL dan anon key di Netlify env vars
- Tambahkan Netlify site URL ke Supabase → Authentication → URL Configuration → Site URL
- Tambahkan `https://your-site.netlify.app/**` ke Redirect URLs

### API Calls Gagal (404)?
- Normal! Endpoint `/api/*` dari Express belum di-migrate
- Solusi: Ganti dengan direct Supabase atau buat Netlify Functions

---

## 📞 Next Steps

Setelah deploy frontend:
1. Share URL Netlify kamu
2. Test fitur apa yang jalan dan tidak jalan
3. Saya akan bantu migrate API endpoints yang diperlukan

**Goal:** Frontend + Supabase (100% serverless, no server cost!) ✨
