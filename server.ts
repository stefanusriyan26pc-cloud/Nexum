import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { getSupabase, isSupabaseConfigured } from './lib/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT ?? '3000', 10);
const DIST_DIR = path.join(__dirname, 'dist');

async function seedSupabaseIfEmpty() {
  const supabase = getSupabase();
  if (!supabase) return;

  const { count: projectCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
  if (projectCount && projectCount > 0) return;

  const { data: projects } = await supabase
    .from('projects')
    .insert([
      { name: 'Website Redesign', description: 'Overhaul of the main marketing site.', status: 'active', progress: 75, due_date: '2026-10-15', color: 'bg-indigo-500' },
      { name: 'Mobile App Launch', description: 'iOS and Android release.', status: 'at-risk', progress: 40, due_date: '2026-11-01', color: 'bg-rose-500' },
    ])
    .select('id')
    .throwOnError();

  const p1 = projects?.[0]?.id;
  const p2 = projects?.[1]?.id;

  if (p1 || p2) {
    await supabase.from('tasks').insert([
      { title: 'Design System Update', status: 'todo', priority: 'high', project_id: p1 ?? null, due_date: 'Today' },
      { title: 'API Integration', status: 'in-progress', priority: 'high', project_id: p2 ?? null, due_date: 'Next Week' },
      { title: 'Q3 Planning Deck', status: 'done', priority: 'medium', project_id: p1 ?? null, due_date: 'Yesterday' },
    ]);
  }

  await supabase.from('events').insert([
    { title: 'Design Review', date: '2026-02-26', type: 'meeting', start_time: '10:00', end_time: '10:30' },
    { title: 'Launch App', date: '2026-02-28', type: 'milestone', start_time: '12:00', end_time: '12:30' },
  ]);

  const { count: profileCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  if (!profileCount || profileCount === 0) {
    await supabase.from('profiles').insert({
      first_name: 'Nexum',
      last_name: 'User',
      email: 'nexum@example.com',
      currency: 'USD',
    });
  }

  console.log('✓ Supabase seed data inserted');
}

async function startServer() {
  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    console.log('✓ Supabase connected');
    await seedSupabaseIfEmpty();
  } else {
    console.warn('⚠ Supabase not configured (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). API will return empty data.');
  }

  const app = express();

  // ── Security headers ─────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", 'https://generativelanguage.googleapis.com', 'https://*.supabase.co'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ── CORS ─────────────────────────────────────────────────────
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin '${origin}' not allowed`));
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use('/api', apiLimiter);

  // ── Health check ──────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV ?? 'development',
      db: isSupabaseConfigured() ? 'supabase' : 'none',
    });
  });

  // ── Projects API ───────────────────────────────────────────────
  app.get('/api/projects', async (req, res) => {
    const sup = getSupabase();
    if (!sup) return res.json([]);

    const { data: projects, error } = await sup.from('projects').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('[Projects GET]', error);
      return res.status(500).json({ error: error.message });
    }

    const withTasks = await Promise.all(
      (projects ?? []).map(async (p) => {
        const { count: total } = await sup.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', p.id);
        const { count: completed } = await sup.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', p.id).eq('status', 'done');
        return {
          ...p,
          tasks: { total: total ?? 0, completed: completed ?? 0 },
          team: 3,
        };
      }),
    );
    res.json(withTasks);
  });

  app.post('/api/projects', async (req, res) => {
    const sup = getSupabase();
    const { name, description, status, progress, due_date, color } = req.body;

    if (!sup) {
      return res.json({
        id: randomUUID(),
        name: name || 'New Project',
        description: description || '',
        status: status || 'planning',
        progress: progress ?? 0,
        due_date: due_date || '',
        color: color || 'bg-blue-500',
      });
    }

    const { data, error } = await sup
      .from('projects')
      .insert({
        name: name || 'New Project',
        description: description ?? '',
        status: status || 'planning',
        progress: progress ?? 0,
        due_date: due_date || null,
        color: color || 'bg-blue-500',
      })
      .select()
      .single();

    if (error) {
      console.error('[Projects POST]', error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  });

  app.put('/api/projects/:id', async (req, res) => {
    const sup = getSupabase();
    if (!sup) return res.json({ success: true });

    const { name, description, status, progress, due_date, color } = req.body;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (progress !== undefined) updates.progress = progress;
    if (due_date !== undefined) updates.due_date = due_date;
    if (color !== undefined) updates.color = color;

    const { error } = await sup.from('projects').update(updates).eq('id', req.params.id);
    if (error) {
      console.error('[Projects PUT]', error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
  });

  app.delete('/api/projects/:id', async (req, res) => {
    const sup = getSupabase();
    if (!sup) return res.json({ success: true });

    const { error } = await sup.from('projects').delete().eq('id', req.params.id);
    if (error) {
      console.error('[Projects DELETE]', error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
  });

  // ── Tasks API ───────────────────────────────────────────────────
  app.get('/api/tasks', async (req, res) => {
    const sup = getSupabase();
    if (!sup) return res.json([]);

    const { data: tasks, error } = await sup
      .from('tasks')
      .select(`
        *,
        projects ( name )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Tasks GET]', error);
      return res.status(500).json({ error: error.message });
    }

    const mapped = (tasks ?? []).map((t: { projects?: { name?: string } }) => ({
      ...t,
      project: (t.projects as { name?: string })?.name ?? 'No Project',
    }));
    res.json(mapped);
  });

  app.post('/api/tasks', async (req, res) => {
    const sup = getSupabase();
    const { title, status, priority, project_id, due_date, description } = req.body;

    if (!sup) {
      return res.json({
        id: randomUUID(),
        title: title || 'New Task',
        status: status || 'todo',
        priority: priority || 'medium',
        project_id: project_id || null,
        due_date: due_date || 'Today',
      });
    }

    const { data, error } = await sup
      .from('tasks')
      .insert({
        title: title || 'New Task',
        status: status || 'todo',
        priority: priority || 'medium',
        project_id: project_id || null,
        due_date: due_date || null,
        description: description ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('[Tasks POST]', error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  });

  app.put('/api/tasks/:id', async (req, res) => {
    const sup = getSupabase();
    const { status, title, priority, project_id, due_date, description } = req.body;

    if (!sup) return res.json({ success: true });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status !== undefined) updates.status = status;
    if (title !== undefined) updates.title = title;
    if (priority !== undefined) updates.priority = priority;
    if (project_id !== undefined) updates.project_id = project_id;
    if (due_date !== undefined) updates.due_date = due_date;
    if (description !== undefined) updates.description = description;

    const { error } = await sup.from('tasks').update(updates).eq('id', req.params.id);
    if (error) {
      console.error('[Tasks PUT]', error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
  });

  app.delete('/api/tasks/:id', async (req, res) => {
    const sup = getSupabase();
    if (!sup) return res.json({ success: true });

    const { error } = await sup.from('tasks').delete().eq('id', req.params.id);
    if (error) {
      console.error('[Tasks DELETE]', error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
  });

  // ── Events API ──────────────────────────────────────────────────
  app.get('/api/events', async (req, res) => {
    const sup = getSupabase();
    if (!sup) return res.json([]);

    const { data, error } = await sup.from('events').select('*').order('date', { ascending: true });

    if (error) {
      console.error('[Events GET]', error);
      return res.status(500).json({ error: error.message });
    }

    // Map to legacy format (time) for backward compat
    const mapped = (data ?? []).map((e) => ({
      ...e,
      time: e.start_time,
    }));
    res.json(mapped);
  });

  app.post('/api/events', async (req, res) => {
    const sup = getSupabase();
    const {
      title,
      date,
      type,
      time,
      start_time,
      end_time,
      location,
      description,
      recurring,
      linked_task_id,
      linked_project_id,
    } = req.body;

    const payload = {
      title: title || 'New Event',
      date: date || new Date().toISOString().split('T')[0],
      type: type || 'meeting',
      start_time: start_time ?? time ?? '09:00',
      end_time: end_time ?? '10:00',
      location: location ?? null,
      description: description ?? null,
      recurring: recurring ?? 'none',
      linked_task_id: linked_task_id ?? null,
      linked_project_id: linked_project_id ?? null,
    };

    if (!sup) {
      return res.json({ id: randomUUID(), ...payload, time: payload.start_time });
    }

    const { data, error } = await sup.from('events').insert(payload).select().single();

    if (error) {
      console.error('[Events POST]', error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ ...data, time: data.start_time });
  });

  app.put('/api/events/:id', async (req, res) => {
    const sup = getSupabase();
    if (!sup) return res.json({ success: true });

    const { title, date, type, start_time, end_time, location, description, recurring } = req.body;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (date !== undefined) updates.date = date;
    if (type !== undefined) updates.type = type;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;
    if (location !== undefined) updates.location = location;
    if (description !== undefined) updates.description = description;
    if (recurring !== undefined) updates.recurring = recurring;

    const { error } = await sup.from('events').update(updates).eq('id', req.params.id);
    if (error) {
      console.error('[Events PUT]', error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
  });

  app.delete('/api/events/:id', async (req, res) => {
    const sup = getSupabase();
    if (!sup) return res.json({ success: true });

    const { error } = await sup.from('events').delete().eq('id', req.params.id);
    if (error) {
      console.error('[Events DELETE]', error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
  });

  // ── Transactions API ────────────────────────────────────────────
  app.get('/api/transactions', async (req, res) => {
    const sup = getSupabase();
    if (!sup) return res.json([]);

    const { data, error } = await sup.from('transactions').select('*').order('date', { ascending: false });

    if (error) {
      console.error('[Transactions GET]', error);
      return res.status(500).json({ error: error.message });
    }

    const mapped = (data ?? []).map((t) => ({
      id: t.id,
      type: t.type,
      title: t.title,
      amount: Number(t.amount),
      date: t.date,
      bank: t.bank ?? undefined,
      sourceOrCategory: t.source_or_category ?? undefined,
      recurring: t.recurring ?? undefined,
      projectId: t.project_id ?? undefined,
    }));
    res.json(mapped);
  });

  app.post('/api/transactions', async (req, res) => {
    const sup = getSupabase();
    const { type, title, amount, date, bank, sourceOrCategory, recurring, projectId } = req.body;

    if (!sup) {
      return res.json({
        id: randomUUID(),
        type: type || 'expense',
        title: title || 'Transaction',
        amount: amount ?? 0,
        date: date || new Date().toISOString().split('T')[0],
        bank: bank ?? undefined,
        sourceOrCategory: sourceOrCategory ?? undefined,
        recurring: recurring ?? undefined,
        projectId: projectId ?? undefined,
      });
    }

    const { data, error } = await sup
      .from('transactions')
      .insert({
        type: type || 'expense',
        title: title || 'Transaction',
        amount: amount ?? 0,
        date: date || new Date().toISOString().split('T')[0],
        bank: bank ?? null,
        source_or_category: sourceOrCategory ?? null,
        recurring: recurring ?? 'none',
        project_id: projectId ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('[Transactions POST]', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({
      id: data.id,
      type: data.type,
      title: data.title,
      amount: Number(data.amount),
      date: data.date,
      bank: data.bank ?? undefined,
      sourceOrCategory: data.source_or_category ?? undefined,
      recurring: data.recurring ?? undefined,
      projectId: data.project_id ?? undefined,
    });
  });

  app.put('/api/transactions/:id', async (req, res) => {
    const sup = getSupabase();
    const { type, title, amount, date, bank, sourceOrCategory, recurring } = req.body;

    if (!sup) return res.json({ success: true });

    const updates = { updated_at: new Date().toISOString() };
    if (type !== undefined) (updates as Record<string, unknown>).type = type;
    if (title !== undefined) (updates as Record<string, unknown>).title = title;
    if (amount !== undefined) (updates as Record<string, unknown>).amount = amount;
    if (date !== undefined) (updates as Record<string, unknown>).date = date;
    if (bank !== undefined) (updates as Record<string, unknown>).bank = bank;
    if (sourceOrCategory !== undefined) (updates as Record<string, unknown>).source_or_category = sourceOrCategory;
    if (recurring !== undefined) (updates as Record<string, unknown>).recurring = recurring;

    const { error } = await sup.from('transactions').update(updates).eq('id', req.params.id);
    if (error) {
      console.error('[Transactions PUT]', error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
  });

  app.delete('/api/transactions/:id', async (req, res) => {
    const sup = getSupabase();
    if (!sup) return res.json({ success: true });

    const { error } = await sup.from('transactions').delete().eq('id', req.params.id);
    if (error) {
      console.error('[Transactions DELETE]', error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
  });

  // ── Profile API (per-auth user) ─────────────────────────────────
  app.get('/api/profile', async (req, res) => {
    const sup = getSupabase();

    // When Supabase is not configured, always return a sane default profile
    if (!sup || !isSupabaseConfigured()) {
      return res.json({
        firstName: 'Nexum',
        lastName: 'User',
        username: null,
        email: 'nexum@example.com',
        avatarSrc: null,
        currency: 'USD',
        notificationsSeenAt: null,
      });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    // For unauthenticated users, fall back to a default profile instead of failing
    if (!token) {
      return res.json({
        firstName: 'Nexum',
        lastName: 'User',
        username: null,
        email: 'nexum@example.com',
        avatarSrc: null,
        currency: 'USD',
        notificationsSeenAt: null,
      });
    }

    const { data: userData, error: userError } = await sup.auth.getUser(token);
    if (userError || !userData.user) {
      console.warn('[Profile GET] Invalid auth token, returning default profile');
      return res.json({
        firstName: 'Nexum',
        lastName: 'User',
        username: null,
        email: 'nexum@example.com',
        avatarSrc: null,
        currency: 'USD',
        notificationsSeenAt: null,
      });
    }

    const authUser = userData.user;
    const userId = authUser.id;

    const { data, error } = await sup.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (error) {
      console.error('[Profile GET]', error);
    }

    let row = data;
    if (!row) {
      const meta = authUser.user_metadata as { name?: string; username?: string } | undefined;
      const fullName = (meta?.name as string | undefined) ?? '';
      let firstName: string | null = null;
      let lastName: string | null = null;
      if (fullName.trim()) {
        const parts = fullName.trim().split(' ');
        firstName = parts[0];
        if (parts.length > 1) lastName = parts.slice(1).join(' ');
      }

      const { data: inserted, error: insertError } = await sup
        .from('profiles')
        .insert({
          user_id: userId,
          first_name: firstName ?? (authUser.email ? String(authUser.email).split('@')[0] : 'Nexum'),
          last_name: lastName,
          username: meta?.username ?? null,
          email: authUser.email ?? 'nexum@example.com',
          avatar_src: null,
          currency: 'USD',
          notifications_seen_at: null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[Profile INSERT]', insertError);
        return res.status(500).json({ error: insertError.message });
      }
      row = inserted;
    }

    res.json({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      username: row.username,
      email: row.email,
      avatarSrc: row.avatar_src,
      currency: row.currency,
      notificationsSeenAt: row.notifications_seen_at,
    });
  });

  app.put('/api/profile', async (req, res) => {
    const sup = getSupabase();
    if (!sup || !isSupabaseConfigured()) {
      // In non-Supabase setups we just accept the update and let the frontend hold state
      return res.json({ success: true });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      // Allow anonymous profile updates to be no-ops so the UI does not break
      return res.json({ success: true });
    }

    const { data: userData, error: userError } = await sup.auth.getUser(token);
    if (userError || !userData.user) {
      console.warn('[Profile PUT] Invalid auth token, ignoring update');
      return res.json({ success: true });
    }

    const authUser = userData.user;
    const userId = authUser.id;

    const { firstName, lastName, username, email, avatarSrc, currency, notificationsSeenAt } = req.body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;
    if (email !== undefined) updates.email = email;
    if (username !== undefined) updates.username = username;
    if (avatarSrc !== undefined) updates.avatar_src = avatarSrc;
    if (currency !== undefined) updates.currency = currency;
    if (notificationsSeenAt !== undefined) updates.notifications_seen_at = notificationsSeenAt;

    const { data: existing } = await sup.from('profiles').select('id').eq('user_id', userId).maybeSingle();

    if (existing?.id) {
      const { error } = await sup.from('profiles').update(updates).eq('id', existing.id);
      if (error) {
        console.error('[Profile PUT]', error);
        return res.status(500).json({ error: error.message });
      }
    } else {
      const { error } = await sup
        .from('profiles')
        .insert({
          user_id: userId,
          first_name: firstName ?? (authUser.email ? String(authUser.email).split('@')[0] : 'Nexum'),
          last_name: lastName ?? null,
          username: username ?? null,
          email: email ?? authUser.email ?? 'nexum@example.com',
          avatar_src: avatarSrc ?? null,
          currency: currency ?? 'USD',
          notifications_seen_at: notificationsSeenAt ?? null,
        })
        .select()
        .single();
      if (error) {
        console.error('[Profile POST]', error);
        return res.status(500).json({ error: error.message });
      }
    }
    res.json({ success: true });
  });

  // ── Analytics API ───────────────────────────────────────────────
  app.get('/api/analytics', async (req, res) => {
    const sup = getSupabase();
    if (!sup) {
      return res.json({
        completionRate: 33,
        tasksCreated: 3,
        avgFocusTime: '4.2h',
        productivityScore: 92,
      });
    }

    const { count: totalTasks } = await sup.from('tasks').select('*', { count: 'exact', head: true });
    const { count: completedTasks } = await sup.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done');

    const completionRate = (totalTasks ?? 0) > 0 ? Math.round(((completedTasks ?? 0) / (totalTasks ?? 1)) * 100) : 0;

    res.json({
      completionRate,
      tasksCreated: totalTasks ?? 0,
      avgFocusTime: '4.2h',
      productivityScore: 92,
    });
  });

  // ── Exchange Rates API ─────────────────────────────────────────
  app.get('/api/exchange-rates', async (req, res) => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/IDR');
      if (!response.ok) return res.status(500).json({ error: 'Failed to fetch rates' });

      const data = await response.json();
      const rates = data.rates;

      res.json({
        rates: {
          USD: rates.USD || 0.000063,
          EUR: rates.EUR || 0.000058,
          SGD: rates.SGD || 0.000085,
          JPY: rates.JPY || 0.0093,
        },
      });
    } catch (error) {
      console.warn('Failed to fetch exchange rates:', error);
      res.json({
        rates: {
          USD: 0.000063,
          EUR: 0.000058,
          SGD: 0.000085,
          JPY: 0.0093,
        },
      });
    }
  });

  // ── Auth API (Supabase Auth) ───────────────────────────────────
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const sup = getSupabase();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    if (!sup) {
      return res.status(500).json({ error: 'Authentication is not configured' });
    }

    const { data, error } = await sup.auth.signInWithPassword({ email, password });
    if (error) {
      return res.status(401).json({ error: error.message });
    }
    res.json({
      token: data.session?.access_token,
      user: data.user ? { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name } : null,
    });
  });

  app.post('/api/auth/register', async (req, res) => {
    const { email, password, firstName, lastName, username } = req.body;
    const sup = getSupabase();
    if (!sup || !email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const fullName =
      [firstName, lastName].filter((p: string | undefined) => p && p.trim().length > 0).join(' ') || email;

    const { data, error } = await sup.auth.signUp({
      email,
      password,
      options: { data: { name: fullName, username: username ?? null } },
    });
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.json({
      user: data.user ? { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name } : null,
      message: 'Check your email to confirm your account',
    });
  });

  app.post('/api/auth/logout', async (req, res) => {
    const sup = getSupabase();
    if (sup) await sup.auth.signOut();
    res.json({ success: true });
  });

  app.get('/api/auth/session', async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    const sup = getSupabase();
    if (!sup || !token) return res.json({ user: null });

    const { data } = await sup.auth.getUser(token);
    res.json({ user: data.user });
  });

  // ── Serve frontend ───────────────────────────────────────────
  if (IS_PROD) {
    app.use(express.static(DIST_DIR, { maxAge: '1y', immutable: true, index: false }));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'Not found' });
      } else {
        res.sendFile(path.join(DIST_DIR, 'index.html'));
      }
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Server Error]', err.message);
    const status = (err as { status?: number }).status ?? 500;
    res.status(status).json({
      error: IS_PROD ? 'Internal server error' : err.message,
    });
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀  Nexum is running`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Mode:    ${IS_PROD ? 'production' : 'development'}`);
    console.log(`   DB:      ${isSupabaseConfigured() ? 'Supabase' : 'none (configure SUPABASE_*)'}\n`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n[${signal}] Shutting down gracefully…`);
    server.close(() => {
      console.log('Server closed. Goodbye.\n');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
