# 🎯 Quick Deploy Reference

## Environment Variables untuk Deployment

### 🔵 Backend di Koyeb

```bash
NODE_ENV=production
PORT=3000
APP_URL=https://nexus-api.koyeb.app
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
GEMINI_API_KEY=xxxxx
CORS_ORIGINS=http://localhost:3000,https://nexus-app.vercel.app
```

**Build:** `npm install && npm run build`  
**Run:** `npm run start`  
**Runtime:** Node 20

---

### 🟢 Frontend di Vercel

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
VITE_API_BASE_URL=https://nexus-api.koyeb.app
GEMINI_API_KEY=xxxxx
```

**Build Command:** `npm run build`  
**Output Directory:** `dist`  
**Framework:** Vite

---

## Deploy Checklist

### Koyeb (Backend)
- [ ] Push code ke GitHub
- [ ] Create App di Koyeb
- [ ] Connect GitHub repository
- [ ] Set environment variables
- [ ] Deploy
- [ ] Catat URL backend
- [ ] Test: `https://your-app.koyeb.app/api/health`

### Vercel (Frontend)  
- [ ] Create Project di Vercel
- [ ] Connect same GitHub repository
- [ ] Set environment variables (include `VITE_API_BASE_URL`)
- [ ] Deploy
- [ ] Catat URL frontend
- [ ] Update `CORS_ORIGINS` di Koyeb
- [ ] Test frontend di browser

---

## Testing

```bash
# Health check
curl https://nexus-api.koyeb.app/api/health

# Test projects
curl https://nexus-api.koyeb.app/api/projects

# Browser
Open https://your-app.vercel.app
Check Console for errors
Check Network tab for API calls
```

---

**📖 Full Guide:** Lihat `DEPLOYMENT_GUIDE.md`  
**📝 Changes:** Lihat `DEPLOYMENT_CHANGES.md`
