import { Handler, HandlerResponse } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// Helper to parse URL path
function getPath(url: string): string {
  return new URL(url, 'http://localhost').pathname;
}

// Helper to handle JSON response
function json<T>(data: T, status = 200): HandlerResponse {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

// Helper to extract auth token
function getAuthToken(headers: Record<string, string | undefined>): string | null {
  const auth = (headers['authorization'] || headers['Authorization']) as string | undefined;
  return auth?.startsWith('Bearer ') ? auth.slice(7) : null;
}

// Auth endpoints
async function handleAuth(path: string, method: string, body: any, headers: Record<string, string | undefined>) {
  // Demo login (when Supabase not configured)
  if (path === '/api/auth/login' && method === 'POST') {
    if (!supabase) {
      return json({ token: 'demo_token_123', user: { email: body.email, id: 'demo_user' } });
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });
      if (error) return json({ error: error.message }, 400);
      return json({ token: data.session?.access_token, user: data.user });
    } catch (err) {
      return json({ error: 'Sign in failed' }, 500);
    }
  }

  if (path === '/api/auth/register' && method === 'POST') {
    if (!supabase) {
      return json({ message: 'Check your email to confirm' });
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: body.email,
        password: body.password,
        options: {
          data: { firstName: body.firstName, lastName: body.lastName },
        },
      });
      if (error) return json({ error: error.message }, 400);
      return json({ message: 'Check your email to confirm', user: data.user });
    } catch (err) {
      return json({ error: 'Sign up failed' }, 500);
    }
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    if (!supabase) {
      return json({ message: 'Logged out' });
    }
    try {
      await supabase.auth.signOut();
      return json({ message: 'Logged out' });
    } catch (err) {
      return json({ error: 'Logout failed' }, 500);
    }
  }

  if (path === '/api/auth/session' && method === 'GET') {
    if (!supabase) {
      return json({ user: null, session: null });
    }
    try {
      const { data } = await supabase.auth.getSession();
      return json({ user: data.session?.user, session: data.session });
    } catch (err) {
      return json({ user: null, session: null });
    }
  }

  return json({ error: 'Not found' }, 404);
}

// Projects endpoints
async function handleProjects(path: string, method: string, body: any) {
  if (!supabase) {
    if (method === 'GET') return json([]);
    if (method === 'POST') return json({ id: '1', ...body }, 201);
    return json({ message: 'OK' });
  }

  const match = path.match(/^\/api\/projects(?:\/(.+))?$/);
  const id = match?.[1];

  try {
    if (method === 'GET' && !id) {
      const { data } = await supabase.from('projects').select('*, tasks(*)').order('created_at', { ascending: false });
      return json(data || []);
    }

    if (method === 'GET' && id) {
      const { data } = await supabase.from('projects').select('*, tasks(*)').eq('id', id).single();
      return json(data || {});
    }

    if (method === 'POST') {
      const { data, error } = await supabase.from('projects').insert(body).select().single();
      if (error) return json({ error: error.message }, 400);
      return json(data, 201);
    }

    if (method === 'PUT' && id) {
      const { data, error } = await supabase.from('projects').update(body).eq('id', id).select().single();
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }

    if (method === 'DELETE' && id) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) return json({ error: error.message }, 400);
      return json({ message: 'Deleted' });
    }
  } catch (err) {
    return json({ error: String(err) }, 500);
  }

  return json({ error: 'Not found' }, 404);
}

// Tasks endpoints
async function handleTasks(path: string, method: string, body: any) {
  if (!supabase) {
    if (method === 'GET') return json([]);
    if (method === 'POST') return json({ id: '1', ...body }, 201);
    return json({ message: 'OK' });
  }

  const match = path.match(/^\/api\/tasks(?:\/(.+))?$/);
  const id = match?.[1];

  try {
    if (method === 'GET' && !id) {
      const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      return json(data || []);
    }

    if (method === 'GET' && id) {
      const { data } = await supabase.from('tasks').select('*').eq('id', id).single();
      return json(data || {});
    }

    if (method === 'POST') {
      const { data, error } = await supabase.from('tasks').insert(body).select().single();
      if (error) return json({ error: error.message }, 400);
      return json(data, 201);
    }

    if (method === 'PUT' && id) {
      const { data, error } = await supabase.from('tasks').update(body).eq('id', id).select().single();
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }

    if (method === 'DELETE' && id) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) return json({ error: error.message }, 400);
      return json({ message: 'Deleted' });
    }
  } catch (err) {
    return json({ error: String(err) }, 500);
  }

  return json({ error: 'Not found' }, 404);
}

// Events endpoints
async function handleEvents(path: string, method: string, body: any) {
  if (!supabase) {
    if (method === 'GET') return json([]);
    if (method === 'POST') return json({ id: '1', ...body }, 201);
    return json({ message: 'OK' });
  }

  const match = path.match(/^\/api\/events(?:\/(.+))?$/);
  const id = match?.[1];

  try {
    if (method === 'GET' && !id) {
      const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
      return json(data || []);
    }

    if (method === 'GET' && id) {
      const { data } = await supabase.from('events').select('*').eq('id', id).single();
      return json(data || {});
    }

    if (method === 'POST') {
      const { data, error } = await supabase.from('events').insert(body).select().single();
      if (error) return json({ error: error.message }, 400);
      return json(data, 201);
    }

    if (method === 'PUT' && id) {
      const { data, error } = await supabase.from('events').update(body).eq('id', id).select().single();
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }

    if (method === 'DELETE' && id) {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) return json({ error: error.message }, 400);
      return json({ message: 'Deleted' });
    }
  } catch (err) {
    return json({ error: String(err) }, 500);
  }

  return json({ error: 'Not found' }, 404);
}

// Transactions endpoints
async function handleTransactions(path: string, method: string, body: any) {
  if (!supabase) {
    if (method === 'GET') return json([]);
    if (method === 'POST') return json({ id: '1', ...body }, 201);
    return json({ message: 'OK' });
  }

  const match = path.match(/^\/api\/transactions(?:\/(.+))?$/);
  const id = match?.[1];

  try {
    if (method === 'GET' && !id) {
      const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      return json(data || []);
    }

    if (method === 'POST') {
      const { data, error } = await supabase.from('transactions').insert(body).select().single();
      if (error) return json({ error: error.message }, 400);
      return json(data, 201);
    }

    if (method === 'DELETE' && id) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) return json({ error: error.message }, 400);
      return json({ message: 'Deleted' });
    }
  } catch (err) {
    return json({ error: String(err) }, 500);
  }

  return json({ error: 'Not found' }, 404);
}

// Profile endpoint
async function handleProfile(path: string, method: string, body: any, headers: Record<string, string | undefined>) {
  if (path !== '/api/profile') return null;

  if (!supabase) {
    if (method === 'GET') {
      return json({
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@example.com',
        currency: 'USD',
      });
    }
    return json({ message: 'OK' });
  }

  try {
    if (method === 'GET') {
      const token = getAuthToken(headers);
      if (!token) {
        return json({ error: 'Unauthorized' }, 401);
      }

      const { data: user } = await supabase.auth.getUser(token);
      if (!user.user) {
        return json({ error: 'Unauthorized' }, 401);
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single();

      return json(profile || { id: user.user.id, email: user.user.email });
    }

    if (method === 'PUT') {
      const token = getAuthToken(headers);
      if (!token) {
        return json({ error: 'Unauthorized' }, 401);
      }

      const { data: user } = await supabase.auth.getUser(token);
      if (!user.user) {
        return json({ error: 'Unauthorized' }, 401);
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(body)
        .eq('id', user.user.id)
        .select()
        .single();

      if (error) return json({ error: error.message }, 400);
      return json(data);
    }
  } catch (err) {
    return json({ error: String(err) }, 500);
  }

  return null;
}

// Exchange rates (for Finance page)
async function handleExchangeRates() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!response.ok) {
      return json(
        {
          rates: { IDR: 16000, SGD: 1.35, EUR: 0.92, JPY: 150 },
        },
        200
      );
    }
    const data = await response.json();
    return json(data);
  } catch {
    return json(
      {
        rates: { IDR: 16000, SGD: 1.35, EUR: 0.92, JPY: 150 },
      },
      200
    );
  }
}

// Analytics
async function handleAnalytics(path: string, method: string) {
  if (!supabase) {
    return json({
      totalProjects: 0,
      completedTasks: 0,
      totalIncome: 0,
      totalExpense: 0,
    });
  }

  try {
    const [projectRes, taskRes, transactionRes] = await Promise.all([
      supabase.from('projects').select('id'),
      supabase.from('tasks').select('id').eq('status', 'done'),
      supabase.from('transactions').select('amount, type'),
    ]);

    const transactions = transactionRes.data || [];
    const totalIncome = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum, t: any) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum, t: any) => sum + t.amount, 0);

    return json({
      totalProjects: projectRes.data?.length || 0,
      completedTasks: taskRes.data?.length || 0,
      totalIncome,
      totalExpense,
    });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
}

// Main handler
export const handler: Handler = async (event) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  const method = event.httpMethod || 'GET';
  const path = getPath(event.rawUrl || event.path || '');

  // Handle preflight
  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  // Parse body
  let body: any = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }
  }

  // Convert node headers - filter out undefined values
  const reqHeaders = Object.fromEntries(
    Object.entries(event.headers || {})
      .map(([k, v]) => [k.toLowerCase(), v])
      .filter(([, v]) => v !== undefined) as [string, string][]
  );

  try {
    // Health check
    if (path === '/api/health') {
      return {
        ...json({ status: 'ok' }),
        headers: { ...json({ status: 'ok' }).headers, ...corsHeaders },
      };
    }

    // Auth routes
    if (path.startsWith('/api/auth/')) {
      const response = await handleAuth(path, method, body, event.headers || {});
      return {
        ...response,
        headers: { ...response.headers, ...corsHeaders },
      };
    }

    // Projects routes
    if (path.startsWith('/api/projects')) {
      const response = await handleProjects(path, method, body);
      return {
        ...response,
        headers: { ...response.headers, ...corsHeaders },
      };
    }

    // Tasks routes
    if (path.startsWith('/api/tasks')) {
      const response = await handleTasks(path, method, body);
      return {
        ...response,
        headers: { ...response.headers, ...corsHeaders },
      };
    }

    // Events routes
    if (path.startsWith('/api/events')) {
      const response = await handleEvents(path, method, body);
      return {
        ...response,
        headers: { ...response.headers, ...corsHeaders },
      };
    }

    // Transactions routes
    if (path.startsWith('/api/transactions')) {
      const response = await handleTransactions(path, method, body);
      return {
        ...response,
        headers: { ...response.headers, ...corsHeaders },
      };
    }

    // Profile route
    const profileResponse = await handleProfile(path, method, body, event.headers || {});
    if (profileResponse) {
      return {
        ...profileResponse,
        headers: { ...profileResponse.headers, ...corsHeaders },
      };
    }

    // Exchange rates
    if (path === '/api/exchange-rates') {
      const response = await handleExchangeRates();
      return {
        ...response,
        headers: { ...response.headers, ...corsHeaders },
      };
    }

    // Analytics
    if (path === '/api/analytics') {
      const response = await handleAnalytics(path, method);
      return {
        ...response,
        headers: { ...response.headers, ...corsHeaders },
      };
    }

    // Not found
    return json({ error: 'Not found' }, 404);
  } catch (error) {
    console.error('API Error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const config = {
  path: '/api/*',
};
