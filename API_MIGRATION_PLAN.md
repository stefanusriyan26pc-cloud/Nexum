# 📊 API Migration Plan - Express ke Netlify

## 🔍 Status Analisis

Berdasarkan [src/lib/api.ts](src/lib/api.ts), aplikasi menggunakan **5 grup endpoint API**:

### 1. Projects API
- `GET /api/projects` - List semua projects
- `POST /api/projects` - Buat project baru
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Hapus project

### 2. Tasks API
- `GET /api/tasks` - List semua tasks
- `POST /api/tasks` - Buat task baru  
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Hapus task

### 3. Events/Calendar API
- `GET /api/events` - List semua events
- `POST /api/events` - Buat event baru
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Hapus event

### 4. Transactions API
- `GET /api/transactions` - List semua transactions
- `POST /api/transactions` - Buat transaction baru
- `DELETE /api/transactions/:id` - Hapus transaction

### 5. Profile API
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

---

## 🎯 Strategi Migrasi (Rekomendasi)

### ✨ Opsi 1: Direct Supabase Calls (HIGHLY RECOMMENDED)

**Keuntungan:**
- ✅ Tidak perlu Netlify Functions sama sekali
- ✅ Lebih cepat (no middle layer)
- ✅ Real-time subscriptions built-in
- ✅ Row Level Security (RLS) untuk keamanan
- ✅ **100% gratis di Netlify**

**Cara Kerja:**
```typescript
// ❌ SEKARANG (via Express API)
import { api } from '@/lib/api';
const projects = await api.getProjects();

// ✅ NANTI (langsung ke Supabase)
import { supabase } from '@/lib/supabaseBrowser';
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .order('created_at', { ascending: false });
```

**Implementasi:**
1. Buat hooks di `src/hooks/useProjects.ts`, `src/hooks/useTasks.ts`, dll
2. Replace semua `api.getProjects()` dengan Supabase queries
3. Hapus dependency ke `src/lib/api.ts`
4. **Hasil: 0 backend server needed!**

---

### ⚡ Opsi 2: Netlify Functions (Jika Butuh Custom Logic)

**Kapan Pakai:**
- Butuh business logic kompleks yang tidak bisa di client
- Butuh akses `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS)
- Perlu validasi/transformasi data di server

**Struktur:**
```
netlify/
  functions/
    projects.ts       # Handle /api/projects
    tasks.ts          # Handle /api/tasks
    events.ts         # Handle /api/events
    transactions.ts   # Handle /api/transactions
    profile.ts        # Handle /api/profile
```

**Contoh Implementation: `netlify/functions/projects.ts`**
```typescript
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  const userId = event.headers['x-user-id']; // dari auth
  
  // GET /api/projects
  if (event.httpMethod === 'GET') {
    const { data, error } = await supabase
      .from('projects')
      .select('*, tasks(*)') // Include related tasks
      .eq('user_id', userId);
      
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    };
  }
  
  // POST /api/projects
  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...body, user_id: userId })
      .select()
      .single();
      
    return {
      statusCode: 201,
      body: JSON.stringify(data)
    };
  }
  
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
```

**Update Frontend:**
```typescript
// src/lib/api.ts
// Ubah API_BASE untuk Netlify Functions
const API_BASE = import.meta.env.PROD 
  ? '/.netlify/functions'  // Production di Netlify
  : '/api';                 // Development lokal

// Existing code tetap sama!
async getProjects(): Promise<ProjectItem[]> {
  const data = await fetchJson<ApiProject[]>(`${API_BASE}/projects`);
  return data.map(mapApiProjectToItem);
}
```

---

## 📋 Action Plan (Step by Step)

### Phase 0: Deploy Frontend Dulu (LAKUKAN SEKARANG!)

```bash
# 1. Push ke GitHub
git push origin main

# 2. Deploy ke Netlify
# - Connect repository di Netlify dashboard
# - Set environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
# - Deploy!
```

**Expected Result:**
- ✅ Frontend bisa diakses
- ⚠️ Login/Register jalan (langsung ke Supabase)
- ❌ List projects/tasks/events gagal (404 karena no backend)

---

### Phase 1: Migrate GET Requests (Paling Mudah)

**Target:** Projects, Tasks, Events, Transactions bisa ditampilkan

**Contoh: Projects List**

1. **Buat query hook** (`src/hooks/useProjects.ts`):
```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseBrowser';
import type { ProjectItem } from '@/lib/api';

export function useProjects() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            tasks:tasks(id, status)
          `)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Transform ke format ProjectItem
        const mapped = data.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || 'No description',
          status: p.status,
          progress: p.progress,
          dueDate: formatDate(p.due_date),
          team: 3,
          tasks: {
            total: p.tasks.length,
            completed: p.tasks.filter(t => t.status === 'done').length
          },
          color: p.color || 'bg-slate-500'
        }));
        
        setProjects(mapped);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  return { projects, loading, error };
}
```

2. **Gunakan di component** ([src/pages/Projects.tsx](src/pages/Projects.tsx)):
```typescript
// ❌ Replace ini:
import { api } from '@/lib/api';
const [projects, setProjects] = useState([]);
useEffect(() => {
  api.getProjects().then(setProjects);
}, []);

// ✅ Jadi ini:
import { useProjects } from '@/hooks/useProjects';
const { projects, loading, error } = useProjects();
```

---

### Phase 2: Migrate CREATE/UPDATE/DELETE

**Upgrade hook dengan mutations:**

```typescript
export function useProjects() {
  // ... state dari Phase 1 ...
  
  const createProject = async (data: CreateProjectData) => {
    const { data: newProject, error } = await supabase
      .from('projects')
      .insert(data)
      .select()
      .single();
      
    if (error) throw error;
    
    // Update local state
    setProjects(prev => [...prev, mapToProjectItem(newProject)]);
    return newProject;
  };
  
  const updateProject = async (id: string, updates: Partial<ProjectData>) => {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id);
      
    if (error) throw error;
    
    // Update local state
    setProjects(prev => 
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    );
  };
  
  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    // Update local state
    setProjects(prev => prev.filter(p => p.id !== id));
  };
  
  return { 
    projects, 
    loading, 
    error,
    createProject,
    updateProject,
    deleteProject
  };
}
```

---

### Phase 3: Enable Real-time (BONUS!)

```typescript
export function useProjects() {
  // ... existing code ...
  
  useEffect(() => {
    // Subscribe to changes
    const subscription = supabase
      .channel('projects-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProjects(prev => [...prev, mapToProjectItem(payload.new)]);
          } else if (payload.eventType === 'UPDATE') {
            setProjects(prev => 
              prev.map(p => p.id === payload.new.id ? mapToProjectItem(payload.new) : p)
            );
          } else if (payload.eventType === 'DELETE') {
            setProjects(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return { projects, loading, error, ... };
}
```

**Hasil:** Multi-user collaboration real-time tanpa polling! 🎉

---

## 🔐 Security: Row Level Security (RLS)

**PENTING:** Untuk keamanan, aktifkan RLS di Supabase:

```sql
-- Enable RLS untuk semua tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: User hanya bisa akses data mereka sendiri
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);
```

Ulangi untuk `tasks`, `events`, `transactions`, `profiles`.

---

## 📈 Timeline Estimasi

| Phase | Task | Time | Complexity |
|-------|------|------|------------|
| **0** | Deploy frontend ke Netlify | 30 min | ⭐ Easy |
| **1** | Migrate GET requests (read-only) | 2-3 hours | ⭐⭐ Medium |
| **2** | Migrate mutations (create/update/delete) | 3-4 hours | ⭐⭐⭐ Medium |
| **3** | Setup RLS policies | 1-2 hours | ⭐⭐ Medium |
| **Bonus** | Real-time subscriptions | 1 hour | ⭐⭐ Medium |

**Total: 1-2 hari kerja untuk full migration** 

---

## 🎁 Benefit Akhir

### Sebelum (Express + Koyeb/Railway):
- ❌ Butuh server backend terpisah
- ❌ Biaya hosting (min $5/month untuk keep-alive)
- ❌ Perlu handle CORS
- ❌ Latency: Client → Backend → Supabase
- ❌ No real-time tanpa setup kompleks

### Sesudah (Netlify + Supabase):
- ✅ **100% serverless, 100% free**
- ✅ Frontend + Database, no backend code
- ✅ No CORS issues
- ✅ Latency: Client → Supabase (lebih cepat!)
- ✅ Real-time built-in
- ✅ Auto-scaling unlimited
- ✅ CDN global untuk frontend

---

## 🚀 Next Steps

Sekarang kamu bisa:

1. **Push & Deploy** (ikuti [GITHUB_NETLIFY_DEPLOY.md](GITHUB_NETLIFY_DEPLOY.md))
2. **Test frontend** di Netlify URL
3. **Pilih strategy:**
   - **Opsi A (Recommended):** Migrate ke direct Supabase calls (saya bisa bantu buat hooks)
   - **Opsi B:** Keep API layer tapi pindah ke Netlify Functions

**Kabari saya hasilnya**, dan kita lanjut migration! 💪
