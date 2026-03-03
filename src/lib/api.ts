// Use VITE_API_BASE_URL for production deployment where frontend (Vercel) and backend (Koyeb) are separate
// In development, both run on same server so empty string works with relative paths
const API_BASE = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : '/api';

export type ApiProject = {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  due_date: string | null;
  color: string;
  tasks: { total: number; completed: number };
  team?: number;
};

export type ApiTask = {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  project_id: string | null;
  project: string;
  due_date: string | null;
  description?: string | null;
  updated_at?: string;
};

export type ApiEvent = {
  id: string;
  title: string;
  date: string;
  type: 'meeting' | 'task' | 'milestone';
  start_time: string;
  end_time: string;
  time?: string;
  location?: string | null;
  description?: string | null;
  recurring?: string;
  linked_task_id?: string | null;
  linked_project_id?: string | null;
};

export type ProjectItem = {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  dueDate: string;
  team: number;
  tasks: { total: number; completed: number };
  color: string;
};

export type TaskItem = {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  project: string;
  dueDate: string;
  dueDateISO?: string;
  description?: string;
  updatedAt?: string;
};

export type CalEvent = {
  id: string;
  title: string;
  date: string;
  type: 'meeting' | 'task' | 'milestone';
  startTime: string;
  endTime: string;
  location?: 'online' | 'offline' | '';
  description?: string;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
  linkedTaskId?: string;
  linkedProjectId?: string;
};

export type ApiTransaction = {
  id: string;
  type: string;
  title: string;
  amount: number;
  date: string;
  bank?: string;
  sourceOrCategory?: string;
  recurring?: string;
  projectId?: string;
};

export type TransactionItem = {
  id: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  date: string;
  bank?: string;
  sourceOrCategory?: string;
  recurring?: string;
  projectId?: string;
};

export type ApiProfile = {
  firstName?: string;
  lastName?: string;
  username?: string | null;
  email?: string;
  avatarSrc?: string | null;
  currency?: string;
  notificationsSeenAt?: string | null;
};

export type ProfileItem = {
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  avatarSrc?: string;
  currency: 'IDR' | 'USD' | 'EUR' | 'SGD' | 'JPY';
  notificationsSeenAt?: string;
};

function formatDueDate(raw: string | null): string {
  if (!raw) return 'No date';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTaskDueDate(raw: string | null): string {
  if (!raw) return 'No Date';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function mapApiProjectToItem(p: ApiProject): ProjectItem {
  return {
    id: p.id,
    name: p.name,
    description: p.description || 'No description.',
    status: p.status,
    progress: p.progress,
    dueDate: formatDueDate(p.due_date),
    team: p.team ?? 3,
    tasks: p.tasks ?? { total: 0, completed: 0 },
    color: p.color || 'bg-slate-500',
  };
}

export function mapApiTaskToItem(t: ApiTask): TaskItem {
  const dueDateISO = t.due_date ? (/\d{4}-\d{2}-\d{2}/.test(t.due_date) ? t.due_date : null) : undefined;
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    project: t.project || 'No Project',
    dueDate: formatTaskDueDate(t.due_date),
    dueDateISO: dueDateISO ?? undefined,
    description: t.description ?? undefined,
    updatedAt: t.updated_at,
  };
}

export function mapApiEventToCalEvent(e: ApiEvent): CalEvent {
  return {
    id: e.id,
    title: e.title,
    date: e.date,
    type: e.type,
    startTime: e.start_time || '09:00',
    endTime: e.end_time || '10:00',
    location: (e.location as CalEvent['location']) ?? '',
    description: e.description ?? undefined,
    recurring: (e.recurring as CalEvent['recurring']) ?? 'none',
    linkedTaskId: e.linked_task_id ?? undefined,
    linkedProjectId: e.linked_project_id ?? undefined,
  };
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('nexum.auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string | null };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async getProjects(): Promise<ProjectItem[]> {
    const data = await fetchJson<ApiProject[]>(`${API_BASE}/projects`);
    return data.map(mapApiProjectToItem);
  },

  async createProject(body: { name: string; description?: string; status?: string; progress?: number; due_date?: string; color?: string }): Promise<ProjectItem> {
    const data = await fetchJson<ApiProject>(`${API_BASE}/projects`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapApiProjectToItem(data);
  },

  async updateProject(id: string, body: Partial<{ name: string; description: string; status: string; progress: number; due_date: string; color: string }>): Promise<void> {
    await fetchJson(`${API_BASE}/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  },

  async deleteProject(id: string): Promise<void> {
    await fetchJson(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
  },

  async getTasks(): Promise<TaskItem[]> {
    const data = await fetchJson<ApiTask[]>(`${API_BASE}/tasks`);
    return data.map(mapApiTaskToItem);
  },

  async createTask(body: { title: string; status?: string; priority?: string; project_id?: string | null; due_date?: string; description?: string }): Promise<TaskItem> {
    const data = await fetchJson<ApiTask>(`${API_BASE}/tasks`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapApiTaskToItem(data);
  },

  async updateTask(id: string, body: Partial<{ status: string; title: string; priority: string; project_id: string | null; due_date: string; description: string }>): Promise<void> {
    await fetchJson(`${API_BASE}/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  },

  async deleteTask(id: string): Promise<void> {
    await fetchJson(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
  },

  async getEvents(): Promise<CalEvent[]> {
    const data = await fetchJson<ApiEvent[]>(`${API_BASE}/events`);
    return data.map(mapApiEventToCalEvent);
  },

  async createEvent(body: {
    title: string;
    date?: string;
    type?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    description?: string;
    recurring?: string;
  }): Promise<CalEvent> {
    const data = await fetchJson<ApiEvent>(`${API_BASE}/events`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapApiEventToCalEvent(data);
  },

  async updateEvent(id: string, body: Partial<{ title: string; date: string; type: string; start_time: string; end_time: string; location?: string; description?: string; recurring?: string }>): Promise<void> {
    await fetchJson(`${API_BASE}/events/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  },

  async deleteEvent(id: string): Promise<void> {
    await fetchJson(`${API_BASE}/events/${id}`, { method: 'DELETE' });
  },

  // Transactions
  async getTransactions(): Promise<TransactionItem[]> {
    const data = await fetchJson<ApiTransaction[]>(`${API_BASE}/transactions`);
    return data.map((t) => ({
      id: t.id,
      type: t.type as 'income' | 'expense',
      title: t.title,
      amount: t.amount,
      date: t.date,
      bank: t.bank,
      sourceOrCategory: t.sourceOrCategory,
      recurring: t.recurring,
      projectId: t.projectId,
    }));
  },

  async createTransaction(body: { type: string; title: string; amount: number; date?: string; bank?: string; sourceOrCategory?: string; recurring?: string }): Promise<TransactionItem> {
    const data = await fetchJson<ApiTransaction>(`${API_BASE}/transactions`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return {
      id: data.id,
      type: data.type as 'income' | 'expense',
      title: data.title,
      amount: data.amount,
      date: data.date,
      bank: data.bank,
      sourceOrCategory: data.sourceOrCategory,
      recurring: data.recurring,
      projectId: data.projectId,
    };
  },

  async deleteTransaction(id: string): Promise<void> {
    await fetchJson(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
  },

  // Profile
  async getProfile(): Promise<ProfileItem> {
    const data = await fetchJson<ApiProfile>(`${API_BASE}/profile`);
    return {
      firstName: data.firstName ?? 'Nexum',
      lastName: data.lastName ?? 'User',
      username: data.username ?? undefined,
      email: data.email ?? 'nexum@example.com',
      avatarSrc: data.avatarSrc ?? undefined,
      currency: (data.currency as ProfileItem['currency']) ?? 'USD',
      notificationsSeenAt: data.notificationsSeenAt ?? undefined,
    };
  },

  async updateProfile(body: Partial<ProfileItem>): Promise<void> {
    await fetchJson(`${API_BASE}/profile`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
};
