import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { api, type ProjectItem, type TaskItem, type CalEvent, type TransactionItem, type ProfileItem } from '@/lib/api';

type ApiDataContextValue = {
  projects: ProjectItem[];
  tasks: TaskItem[];
  events: CalEvent[];
  transactions: TransactionItem[];
  profile: ProfileItem;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;

  // Projects
  addProject: (p: { name: string; description?: string; status?: string; progress?: number; dueDate?: string; color?: string }) => Promise<ProjectItem>;
  updateProject: (id: string, updates: Partial<ProjectItem>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Tasks
  addTask: (t: { title: string; status?: string; priority?: string; project?: string; projectId?: string; dueDate?: string; dueDateISO?: string; description?: string }) => Promise<TaskItem>;
  updateTask: (id: string, updates: Partial<TaskItem>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Events
  addEvent: (e: { title: string; date?: string; type?: string; startTime?: string; endTime?: string; location?: string; description?: string; recurring?: string }) => Promise<CalEvent>;
  updateEvent: (id: string, updates: Partial<CalEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // Transactions
  addTransaction: (t: { type: string; title: string; amount: number; date?: string; bank?: string; sourceOrCategory?: string }) => Promise<TransactionItem>;
  deleteTransaction: (id: string) => Promise<void>;

  // Profile
  updateProfile: (updates: Partial<ProfileItem>) => Promise<void>;
};

const defaultProfile: ProfileItem = {
  firstName: 'Nexum',
  lastName: 'User',
  email: 'nexum@example.com',
  currency: 'USD',
};

const ApiDataContext = createContext<ApiDataContextValue | null>(null);

export function ApiDataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [profile, setProfile] = useState<ProfileItem>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, t, e, tx, prof] = await Promise.all([
        api.getProjects(),
        api.getTasks(),
        api.getEvents(),
        api.getTransactions(),
        api.getProfile(),
      ]);
      setProjects(p);
      setTasks(t);
      setEvents(e);
      setTransactions(tx);
      setProfile(prof);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setProjects([]);
      setTasks([]);
      setEvents([]);
      setTransactions([]);
      setProfile(defaultProfile);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addProject = useCallback(async (body: Parameters<ApiDataContextValue['addProject']>[0]) => {
    const created = await api.createProject({
      name: body.name,
      description: body.description,
      status: body.status,
      progress: body.progress,
      due_date: body.dueDate || undefined,
      color: body.color,
    });
    setProjects((prev) => [...prev, created]);
    return created;
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<ProjectItem>) => {
    await api.updateProject(id, {
      name: updates.name,
      description: updates.description,
      status: updates.status,
      progress: updates.progress,
      due_date: updates.dueDate,
      color: updates.color,
    });
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await api.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addTask = useCallback(
    async (body: Parameters<ApiDataContextValue['addTask']>[0]) => {
      const projectId = body.projectId ?? (body.project ? projects.find((p) => p.name === body.project)?.id : null);
      const created = await api.createTask({
        title: body.title,
        status: body.status,
        priority: body.priority,
        project_id: projectId || null,
        due_date: body.dueDateISO || body.dueDate || undefined,
        description: body.description,
      });
      setTasks((prev) => [...prev, created]);
      return created;
    },
    [projects],
  );

  const updateTask = useCallback(async (id: string, updates: Partial<TaskItem>) => {
    const projectId = updates.project ? projects.find((p) => p.name === updates.project)?.id ?? null : undefined;
    await api.updateTask(id, {
      status: updates.status,
      title: updates.title,
      priority: updates.priority,
      project_id: projectId !== undefined ? projectId : undefined,
      due_date: updates.dueDateISO || updates.dueDate,
      description: updates.description,
    });
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, [projects]);

  const deleteTask = useCallback(async (id: string) => {
    await api.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addEvent = useCallback(async (body: Parameters<ApiDataContextValue['addEvent']>[0]) => {
    const created = await api.createEvent({
      title: body.title,
      date: body.date,
      type: body.type,
      start_time: body.startTime,
      end_time: body.endTime,
      location: body.location,
      description: body.description,
      recurring: body.recurring,
    });
    setEvents((prev) => [...prev, created]);
    return created;
  }, []);

  const updateEvent = useCallback(async (id: string, updates: Partial<CalEvent>) => {
    await api.updateEvent(id, {
      title: updates.title,
      date: updates.date,
      type: updates.type,
      start_time: updates.startTime,
      end_time: updates.endTime,
      location: updates.location,
      description: updates.description,
      recurring: updates.recurring,
    });
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await api.deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addTransaction = useCallback(async (body: Parameters<ApiDataContextValue['addTransaction']>[0]) => {
    const created = await api.createTransaction(body);
    setTransactions((prev) => [created, ...prev]);
    return created;
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    await api.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateProfile = useCallback(async (updates: Partial<ProfileItem>) => {
    await api.updateProfile(updates);
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const value: ApiDataContextValue = {
    projects,
    tasks,
    events,
    transactions,
    profile,
    loading,
    error,
    refetch,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    addEvent,
    updateEvent,
    deleteEvent,
    addTransaction,
    deleteTransaction,
    updateProfile,
  };

  return <ApiDataContext.Provider value={value}>{children}</ApiDataContext.Provider>;
}

export function useApiData() {
  const ctx = useContext(ApiDataContext);
  if (!ctx) throw new Error('useApiData must be used within ApiDataProvider');
  return ctx;
}
