import { useMemo } from 'react';
import { startOfWeek, endOfWeek, isWithinInterval, getDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button, cn } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { CheckCircle2, Calendar, Plus, FolderKanban, Clock, Sparkles, Target, AlertCircle, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useApiData } from '@/contexts/ApiDataContext';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, YAxis, CartesianGrid, Cell } from 'recharts';
import { motion } from 'motion/react';

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getGreeting(now: Date, t: (key: string) => string) {
  const h = now.getHours();
  if (h < 12) return t('dashboard.greetingMorning');
  if (h < 18) return t('dashboard.greetingAfternoon');
  return t('dashboard.greetingEvening');
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const now = new Date();

  const { tasks, projects, transactions, profile } = useApiData();
  const displayName =
    (profile.username && profile.username.trim()) ||
    (profile.firstName && profile.firstName.trim()) ||
    'Nexum';
  const financeSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    transactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, net: income - expense };
  }, [transactions]);
  
  const formatMoney = (amount: number) => {
    const currency = profile.currency || 'IDR';
    const locale = currency === 'IDR' ? 'id-ID' : 'en-US';
    const maximumFractionDigits = currency === 'IDR' ? 0 : 2;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits,
    }).format(amount);
  };

  const { todayFocus, taskStats, weeklyData, productivityScore } = useMemo(() => {
    const focus = tasks
      .filter((t) => t.status !== 'done' && t.dueDateISO && sameDay(new Date(t.dueDateISO), now))
      .slice(0, 5);

    const overdue = tasks.filter((t) => t.dueDateISO && new Date(t.dueDateISO) < now && t.status !== 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const total = tasks.length;

    // Weekly data from actual completed tasks (Supabase)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Mon=0, Tue=1, ..., Sun=6

    tasks
      .filter((t) => t.status === 'done')
      .forEach((t) => {
        const dateStr = t.updatedAt || t.dueDateISO;
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;
        if (!isWithinInterval(d, { start: weekStart, end: weekEnd })) return;
        const dayIndex = getDay(d) === 0 ? 6 : getDay(d) - 1; // Sun=6, Mon=0
        dayCounts[dayIndex]++;
      });

    const weeklyTotal = dayCounts.reduce((a, b) => a + b, 0);

    const weeklyData = days.map((day, i) => ({
      name: day,
      completed: dayCounts[i],
      isToday: i === (now.getDay() === 0 ? 6 : now.getDay() - 1),
    }));

    const productivityScore = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { 
      todayFocus: focus, 
      taskStats: { overdue, inProgress, completed, total, weeklyTotal }, 
      weeklyData,
      productivityScore
    };
  }, [tasks, now]);

  const activeProjects = useMemo(() => {
    const getProgress = (name: string, fallback?: number) => {
      const linked = tasks.filter((t) => (t.project || '').trim() === name.trim());
      if (linked.length === 0) return { progress: fallback ?? 0, completed: 0, total: 0 };
      const completed = linked.filter((t) => t.status === 'done').length;
      return { progress: Math.round((completed / linked.length) * 100), completed, total: linked.length };
    };
    return [...projects].slice(0, 3).map((p) => ({ ...p, ...getProgress(p.name, p.progress) }));
  }, [projects, tasks]);

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4 flex-shrink-0">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl font-display font-semibold text-[var(--color-text-high)] tracking-tight">
              {getGreeting(now, t)}, <span className="text-[var(--color-accent-primary)]">{displayName}</span>
            </h1>
            <p className="text-[var(--color-text-muted)] mt-1 text-sm">{t('dashboard.subtitle')}</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex gap-2"
          >
            <Button onClick={() => navigate('/tasks')} className="shadow-sm" size="sm">
              <Plus className="mr-2 h-4 w-4" /> {t('dashboard.newTask')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/projects')} className="bg-[var(--color-bg-elevated)]" size="sm">
              {t('dashboard.newProject')}
            </Button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-hidden">
          
          {/* Main Column */}
          <div className="lg:col-span-8 flex flex-col gap-3 overflow-y-auto pr-2">
            
            {/* Today's Focus */}
            <Card className="glass-panel overflow-hidden border-none shadow-md bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-secondary)] flex-shrink-0">
              <CardHeader className="py-2 flex-row items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  {t('dashboard.todaysFocus')}
                </CardTitle>
                <Badge variant="outline" className="text-xs">{todayFocus.length} {t('dashboard.tasks')}</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {todayFocus.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-5 px-6 text-center">
                    <div className="h-10 w-10 bg-[var(--color-bg-elevated)] rounded-full flex items-center justify-center mb-2 shadow-sm border border-[var(--color-border-subtle)]">
                      <CheckCircle2 className="h-5 w-5 text-[var(--color-status-success)]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-high)]">{t('dashboard.allCaughtUp')}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-3 max-w-sm">
                      {t('dashboard.noTasksDue')}
                    </p>
                    <Button size="sm" onClick={() => navigate('/tasks')}>
                      {t('dashboard.planNextTasks')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-[var(--color-border-subtle)] max-h-40 overflow-y-auto">
                    {todayFocus.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => navigate('/tasks')}
                        className="flex items-center justify-between gap-4 p-3 hover:bg-[var(--color-bg-hover)] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "h-4 w-4 rounded border flex-shrink-0",
                            task.status === 'in-progress' ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10" : "border-[var(--color-border-strong)]"
                          )} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--color-text-high)] truncate">{task.title}</p>
                            <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">{task.project || t('common.noProject')}</p>
                          </div>
                        </div>
                        <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'info'} className="shrink-0 capitalize text-xs">
                          {task.priority}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Projects */}
            <div className="flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-[var(--color-text-high)] flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-[var(--color-accent-primary)]" />
                  {t('dashboard.activeProjects')}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="text-xs">{t('dashboard.viewAllProjects')}</Button>
              </div>
              
              {activeProjects.length === 0 ? (
                <Card className="border-dashed border-2 bg-transparent shadow-none hover:border-[var(--color-accent-primary)] transition-colors cursor-pointer" onClick={() => navigate('/projects')}>
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Plus className="h-7 w-7 text-[var(--color-text-muted)] mb-2" />
                    <p className="text-sm font-medium text-[var(--color-text-high)]">{t('dashboard.createFirstProject')}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('dashboard.noProjects')}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {activeProjects.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      className="h-full"
                    >
                      <Card className="card-hover cursor-pointer h-full flex flex-col" onClick={() => navigate('/projects')}>
                        <CardContent className="p-3 flex-1 flex flex-col">
                          <h4 className="font-semibold text-sm text-[var(--color-text-high)] truncate">{p.name}</h4>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1 flex-1">
                            {p.dueDate ? `${t('common.dueDate')}: ${p.dueDate}` : t('common.noDate')}
                          </p>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-[var(--color-text-muted)] font-medium">{t('dashboard.progress')}</span>
                              <span className="text-[var(--color-text-high)] font-semibold">{p.progress}%</span>
                            </div>
                            <Progress value={p.progress} className="h-1.5" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Finance Snapshot */}
            <div className="flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-[var(--color-text-high)] flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-[var(--color-status-success)]" />
                  {t('dashboard.financeSummary')}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/finance')} className="text-xs">{t('dashboard.viewFinance')}</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="p-3 border-none shadow-sm bg-[var(--color-bg-elevated)] flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[var(--color-accent-primary)]/10 flex items-center justify-center shrink-0">
                    <Wallet className="h-4 w-4 text-[var(--color-accent-primary)]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{t('dashboard.netBalance')}</p>
                    <p className="text-base font-bold text-[var(--color-text-high)]">{formatMoney(financeSummary.net)}</p>
                  </div>
                </Card>
                <Card className="p-3 border-none shadow-sm bg-[var(--color-bg-elevated)] flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[var(--color-status-success)]/10 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="h-4 w-4 text-[var(--color-status-success)]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{t('dashboard.income')}</p>
                    <p className="text-base font-bold text-[var(--color-status-success)]">{formatMoney(financeSummary.income)}</p>
                  </div>
                </Card>
                <Card className="p-3 border-none shadow-sm bg-[var(--color-bg-elevated)] flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[var(--color-status-danger)]/10 flex items-center justify-center shrink-0">
                    <ArrowDownRight className="h-4 w-4 text-[var(--color-status-danger)]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{t('dashboard.expense')}</p>
                    <p className="text-base font-bold text-[var(--color-status-danger)]">{formatMoney(financeSummary.expense)}</p>
                  </div>
                </Card>
              </div>
            </div>

          </div>
          
          {/* Right Column (Stats & Charts) */}
          <div className="lg:col-span-4 flex flex-col gap-3 overflow-y-auto">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 flex-shrink-0">
              <Card className="p-3 bg-[var(--color-status-danger-bg)] border-none hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-3.5 w-3.5 text-[var(--color-status-danger)]" />
                  <p className="text-xs font-medium text-[var(--color-status-danger)] uppercase tracking-wider">{t('dashboard.overdue')}</p>
                </div>
                <p className="text-2xl font-display font-bold text-[var(--color-status-danger)]">{taskStats.overdue}</p>
                <p className="text-xs text-[var(--color-status-danger)]/70 mt-0.5">{t('dashboard.overdue')}</p>
              </Card>
              <Card className="p-3 bg-[var(--color-status-warning-bg)] border-none hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-3.5 w-3.5 text-[var(--color-status-warning)]" />
                  <p className="text-xs font-medium text-[var(--color-status-warning)] uppercase tracking-wider">{t('dashboard.inProgress')}</p>
                </div>
                <p className="text-2xl font-display font-bold text-[var(--color-status-warning)]">{taskStats.inProgress}</p>
                <p className="text-xs text-[var(--color-status-warning)]/70 mt-0.5">{t('dashboard.inProgress')}</p>
              </Card>
            </div>

            {/* Productivity Score */}
            <Card className="overflow-hidden relative flex-shrink-0">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-accent-primary)]/10 rounded-bl-full -mr-6 -mt-6" />
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-[var(--color-accent-primary)]" />
                  <h3 className="font-semibold text-sm text-[var(--color-text-high)]">{t('dashboard.productivityScore')}</h3>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-3xl font-display font-bold text-[var(--color-text-high)]">{productivityScore}%</span>
                  <span className="text-xs font-medium text-[var(--color-status-success)] flex items-center mb-1">
                    <TrendingUp className="h-3 w-3 mr-1" /> +5%
                  </span>
                </div>
                <Progress value={productivityScore} className="h-1.5 mb-2" />
                <p className="text-xs text-[var(--color-text-muted)]">
                  {taskStats.completed} of {taskStats.total} total tasks completed. You're doing great!
                </p>
              </CardContent>
            </Card>

            {/* Weekly Activity Chart */}
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="pb-0 pt-4 px-4 flex-shrink-0">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart className="h-4 w-4 text-[var(--color-text-muted)]" />
                  {t('dashboard.weeklyActivity')}
                </CardTitle>
                <p className="text-xl font-bold text-[var(--color-text-high)] mt-1">
                  {taskStats.weeklyTotal} <span className="text-xs font-normal text-[var(--color-text-muted)]">{t('dashboard.tasksCompletedThisWeek')}</span>
                </p>
              </CardHeader>
              <CardContent className="flex-1 pt-3 px-3 pb-3 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 500 }} 
                      dy={8}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} 
                      dx={-5}
                    />
                    <Tooltip 
                      cursor={{ fill: 'var(--color-bg-hover)', opacity: 0.5 }}
                      contentStyle={{ 
                        backgroundColor: 'var(--color-bg-elevated)', 
                        borderColor: 'var(--color-border-subtle)', 
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-md)',
                        fontSize: '11px'
                      }}
                      itemStyle={{ color: 'var(--color-text-high)', fontWeight: 600 }}
                      labelStyle={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}
                    />
                    <Bar dataKey="completed" radius={[4, 4, 0, 0]} maxBarSize={35}>
                      {weeklyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.isToday ? 'var(--color-accent-primary)' : 'var(--color-accent-primary-hover)'} 
                          fillOpacity={entry.isToday ? 1 : 0.4}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>
        </div>

      </div>
    </AppLayout>
  );
}
