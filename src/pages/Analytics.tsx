import { useMemo, useState } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button, cn } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { ListTodo, FolderKanban, DollarSign, Download, CheckCircle2, Clock, TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, Activity, ShieldCheck, AlertCircle, Target, Zap, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useApiData } from '@/contexts/ApiDataContext';

type TransactionItem = {
  id: string;
  type: 'income' | 'expense';
  title?: string;
  category?: string;
  sourceOrCategory?: string;
  amount: number;
  date: string;
  bank?: string;
  description?: string;
};

type ReportType = 'tasks' | 'projects' | 'finance';

const CHART_COLORS = [
  'var(--color-accent-primary)',
  'var(--color-status-success)',
  'var(--color-status-warning)',
  'var(--color-status-danger)',
];

const reportOptions: Array<{ id: ReportType; label: string; icon: typeof ListTodo }> = [
  { id: 'tasks', label: 'Tasks Report', icon: ListTodo },
  { id: 'projects', label: 'Projects Report', icon: FolderKanban },
  { id: 'finance', label: 'Finance Report', icon: DollarSign },
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('tasks');

  const { tasks, projects, transactions, profile } = useApiData();

  const tasksCompleted = tasks.filter((t) => t.status === 'done').length;
  const tasksInProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const tasksTodo = tasks.filter((t) => t.status === 'todo').length;
  const completionRate = tasks.length > 0 ? Math.round((tasksCompleted / tasks.length) * 100) : 0;

  const projectsPlanning = projects.filter((p) => p.status === 'planning').length;
  const projectsActive = projects.filter((p) => p.status === 'active').length;
  const projectsOnTrack = projects.filter((p) => p.status === 'on-track').length;
  const projectsAtRisk = projects.filter((p) => p.status === 'at-risk').length;
  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0;

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const tasksByPriority = [
    { name: 'High', value: tasks.filter((t) => t.priority === 'high').length },
    { name: 'Medium', value: tasks.filter((t) => t.priority === 'medium').length },
    { name: 'Low', value: tasks.filter((t) => t.priority === 'low').length },
  ];

  const projectsByStatus = [
    { name: 'Planning', value: projectsPlanning },
    { name: 'Active', value: projectsActive },
    { name: 'On Track', value: projectsOnTrack },
    { name: 'At Risk', value: projectsAtRisk },
  ];

  const cashflowByCategory = useMemo(() => {
    const getCategory = (t: TransactionItem) => t.sourceOrCategory || t.title || 'Other';

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => {
        const key = getCategory(t);
        acc[key] = (acc[key] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        const key = getCategory(t);
        acc[key] = (acc[key] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return {
      income: Object.entries(income).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      expense: Object.entries(expense).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    };
  }, [transactions]);

  // Monthly cashflow for the last 6 months
  const monthlyCashflow = useMemo(() => {
    const months: { key: string; label: string; income: number; expense: number; net: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short' });
      months.push({ key, label, income: 0, expense: 0, net: 0 });
    }
    transactions.forEach((t) => {
      if (!t.date) return;
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = months.find((m) => m.key === key);
      if (!bucket) return;
      if (t.type === 'income') bucket.income += t.amount;
      else bucket.expense += t.amount;
    });
    months.forEach((m) => { m.net = m.income - m.expense; });
    return months;
  }, [transactions]);

  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;
  const expenseRatio = totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : 0;

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

  const formatMoneyShort = (amount: number) => {
    const currency = profile.currency || 'IDR';
    const symbol = currency === 'IDR' ? 'Rp' : '';
    if (Math.abs(amount) >= 1_000_000) return `${symbol} ${(amount / 1_000_000).toFixed(1)}M`;
    if (Math.abs(amount) >= 1_000) return `${symbol} ${(amount / 1_000).toFixed(0)}K`;
    return symbol ? `${symbol} ${amount}` : formatMoney(amount);
  };

  const healthScore = useMemo(() => {
    if (transactions.length === 0) return 0;
    let score = 50;
    if (savingsRate >= 20) score += 30;
    else if (savingsRate >= 10) score += 20;
    else if (savingsRate > 0) score += 10;
    if (netProfit > 0) score += 10;
    if (expenseRatio < 80) score += 10;
    return Math.min(100, score);
  }, [savingsRate, netProfit, expenseRatio, transactions.length]);

  const recentTasks = [...tasks].reverse().slice(0, 10);
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
  const topProjects = [...projects].sort((a, b) => b.progress - a.progress);

  // Tasks: per-project breakdown
  const tasksByProject = useMemo(() => {
    const map: Record<string, { done: number; total: number }> = {};
    tasks.forEach((t) => {
      const key = t.project || 'General';
      if (!map[key]) map[key] = { done: 0, total: 0 };
      map[key].total++;
      if (t.status === 'done') map[key].done++;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v, rate: Math.round((v.done / v.total) * 100) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [tasks]);

  const overdueCount = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => {
      if (t.status === 'done') return false;
      if (!t.dueDate) return false;
      const lower = t.dueDate.toLowerCase();
      if (lower === 'yesterday') return true;
      const d = new Date(t.dueDate);
      return !isNaN(d.getTime()) && d < now;
    }).length;
  }, [tasks]);

  // Task productivity score (0–100)
  const taskProductivityScore = useMemo(() => {
    if (tasks.length === 0) return 0;
    let score = 0;
    if (completionRate >= 70) score += 40;
    else if (completionRate >= 40) score += 25;
    else score += 10;
    const overdueRatio = tasks.length > 0 ? overdueCount / tasks.length : 0;
    if (overdueRatio === 0) score += 30;
    else if (overdueRatio < 0.1) score += 20;
    else if (overdueRatio < 0.25) score += 10;
    if (tasksInProgress > 0) score += 15;
    if (tasks.length >= 5) score += 15;
    return Math.min(100, score);
  }, [completionRate, overdueCount, tasks.length, tasksInProgress]);

  // Project health score (0–100)
  const projectHealthScore = useMemo(() => {
    if (projects.length === 0) return 0;
    let score = 40;
    if (avgProgress >= 60) score += 30;
    else if (avgProgress >= 30) score += 15;
    const atRiskRatio = projects.length > 0 ? projectsAtRisk / projects.length : 0;
    if (atRiskRatio === 0) score += 20;
    else if (atRiskRatio <= 0.2) score += 10;
    if (projectsOnTrack > 0) score += 10;
    return Math.min(100, score);
  }, [avgProgress, projectsAtRisk, projectsOnTrack, projects.length]);

  const handleExportReport = () => {
    const report = {
      exportedAt: new Date().toISOString(),
      type: selectedReport,
      tasks: {
        total: tasks.length,
        completed: tasksCompleted,
        inProgress: tasksInProgress,
        todo: tasksTodo,
        completionRate,
      },
      projects: {
        total: projects.length,
        planning: projectsPlanning,
        active: projectsActive,
        onTrack: projectsOnTrack,
        atRisk: projectsAtRisk,
        avgProgress,
      },
      finance: {
        totalIncome,
        totalExpense,
        netProfit,
        transactions: transactions.length,
      },
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `nexum-reports-${selectedReport}-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Reports"
          description="Unified analytics for tasks, projects, and finance."
          actions={
            <Button className="shrink-0 h-9" onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          }
        />

        <div className="flex flex-wrap gap-2">
          {reportOptions.map((option) => {
            const Icon = option.icon;
            const isActive = selectedReport === option.id;
            return (
              <Button
                key={option.id}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedReport(option.id)}
                className={cn('h-9', isActive && 'ring-2 ring-[var(--color-accent-primary)] shadow-sm')}
              >
                <Icon className="mr-2 h-4 w-4" />
                {option.label}
              </Button>
            );
          })}
        </div>

        {selectedReport === 'tasks' && (
          <div className="flex flex-col gap-5">

            {/* ── Row 1: KPI Cards ────────────────────────────────── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="border-none shadow-sm bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-secondary)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[var(--color-accent-primary)]/5 pointer-events-none" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-[var(--color-accent-primary)]/10 flex items-center justify-center">
                      <ListTodo className="h-4 w-4 text-[var(--color-accent-primary)]" />
                    </div>
                    <Badge variant="info" className="text-xs">Total</Badge>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-accent-primary)] leading-tight">{tasks.length}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">tasks created</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-secondary)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[var(--color-status-success)]/5 pointer-events-none" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-[var(--color-status-success)]/10 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-[var(--color-status-success)]" />
                    </div>
                    <Badge variant="success" className="text-xs">Done</Badge>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-status-success)] leading-tight">{tasksCompleted}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{completionRate}% completion rate</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-secondary)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[var(--color-status-warning)]/5 pointer-events-none" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-[var(--color-status-warning)]/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-[var(--color-status-warning)]" />
                    </div>
                    <Badge variant="warning" className="text-xs">Active</Badge>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-status-warning)] leading-tight">{tasksInProgress}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">in progress</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-secondary)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[var(--color-status-danger)]/5 pointer-events-none" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-[var(--color-status-danger)]/10 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-[var(--color-status-danger)]" />
                    </div>
                    <Badge variant="danger" className="text-xs">Overdue</Badge>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-status-danger)] leading-tight">{overdueCount}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{tasksTodo} still to do</p>
                </CardContent>
              </Card>
            </div>

            {/* ── Row 2: Status Bar Chart ──────────────────────────── */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2 flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-[var(--color-accent-primary)]" />Task Status Overview</CardTitle>
                  <CardDescription>Distribution across To Do, In Progress, and Done</CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent-primary)] inline-block" />To Do</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[var(--color-status-warning)] inline-block" />In Progress</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[var(--color-status-success)] inline-block" />Done</span>
                </div>
              </CardHeader>
              <CardContent className="h-64">
                {tasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-[var(--color-text-muted)]">No task data to display.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'To Do', value: tasksTodo, fill: 'var(--color-accent-primary)' },
                        { name: 'In Progress', value: tasksInProgress, fill: 'var(--color-status-warning)' },
                        { name: 'Done', value: tasksCompleted, fill: 'var(--color-status-success)' },
                        { name: 'Overdue', value: overdueCount, fill: 'var(--color-status-danger)' },
                      ]}
                      margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                      <XAxis dataKey="name" stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} />
                      <YAxis stroke="var(--color-text-muted)" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {[
                          { fill: 'var(--color-accent-primary)' },
                          { fill: 'var(--color-status-warning)' },
                          { fill: 'var(--color-status-success)' },
                          { fill: 'var(--color-status-danger)' },
                        ].map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* ── Row 3: Priority Donut + By Project ──────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Priority Donut */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle>Priority Split</CardTitle>
                  <CardDescription>Task distribution by urgency</CardDescription>
                </CardHeader>
                <CardContent>
                  {tasksByPriority.some(i => i.value > 0) ? (
                    <>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={tasksByPriority} dataKey="value" innerRadius={50} outerRadius={72} paddingAngle={3} startAngle={90} endAngle={-270}>
                              {tasksByPriority.map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', borderRadius: 8, fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {tasksByPriority.map((item, i) => (
                          <div key={item.name} className="rounded-lg p-2 text-center" style={{ background: `${CHART_COLORS[i % CHART_COLORS.length]}15` }}>
                            <p className="text-xs text-[var(--color-text-muted)]">{item.name}</p>
                            <p className="text-sm font-bold mt-0.5" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-sm text-[var(--color-text-muted)]">No data.</div>
                  )}
                </CardContent>
              </Card>

              {/* Tasks by Project (top 5) */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2"><Target className="h-4 w-4 text-[var(--color-status-warning)]" />By Project</CardTitle>
                  <CardDescription>Task count per project</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tasksByProject.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">No project data.</p>
                  ) : (
                    tasksByProject.map((item, index) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: `${CHART_COLORS[index % CHART_COLORS.length]}22`, color: CHART_COLORS[index % CHART_COLORS.length] }}>{index + 1}</span>
                            <span className="text-[var(--color-text-main)] truncate">{item.name}</span>
                          </div>
                          <span className="font-semibold text-[var(--color-text-high)] shrink-0 ml-2">{item.total} tasks</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${tasks.length > 0 ? (item.total / tasks.length) * 100 : 0}%`, background: CHART_COLORS[index % CHART_COLORS.length], opacity: 1 - index * 0.12 }} />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Completion per project */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2"><Zap className="h-4 w-4 text-[var(--color-status-success)]" />Completion Rate</CardTitle>
                  <CardDescription>Done % per project</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tasksByProject.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">No data.</p>
                  ) : (
                    tasksByProject.map((item) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[var(--color-text-main)] truncate max-w-[140px]">{item.name}</span>
                          <span className={cn('font-semibold shrink-0 ml-2', item.rate >= 70 ? 'text-[var(--color-status-success)]' : item.rate >= 40 ? 'text-[var(--color-status-warning)]' : 'text-[var(--color-status-danger)]')}>{item.rate}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${item.rate}%`, background: item.rate >= 70 ? 'var(--color-status-success)' : item.rate >= 40 ? 'var(--color-status-warning)' : 'var(--color-status-danger)' }} />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Row 4: Productivity Score ────────────────────────── */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3 flex-row items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[var(--color-status-planning)]/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-[var(--color-status-planning)]" />
                </div>
                <div>
                  <CardTitle>Productivity Score</CardTitle>
                  <CardDescription>Based on completion rate, overdue tasks, and activity</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center justify-center gap-2 py-2">
                    <div className="relative h-28 w-28">
                      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-border-subtle)" strokeWidth="10" />
                        <circle cx="60" cy="60" r="50" fill="none"
                          stroke={taskProductivityScore >= 70 ? 'var(--color-status-success)' : taskProductivityScore >= 40 ? 'var(--color-status-warning)' : 'var(--color-status-danger)'}
                          strokeWidth="10"
                          strokeDasharray={`${(taskProductivityScore / 100) * 314} 314`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-[var(--color-text-high)]">{taskProductivityScore}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">/ 100</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text-high)]">Productivity</p>
                    <Badge variant={taskProductivityScore >= 70 ? 'success' : taskProductivityScore >= 40 ? 'warning' : 'danger'}>
                      {taskProductivityScore >= 70 ? 'High' : taskProductivityScore >= 40 ? 'Moderate' : 'Low'}
                    </Badge>
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-4 justify-center">
                    {[
                      { label: 'Completion Rate', value: completionRate, color: completionRate >= 70 ? 'var(--color-status-success)' : completionRate >= 40 ? 'var(--color-status-warning)' : 'var(--color-status-danger)', display: `${completionRate}%` },
                      { label: 'In Progress', value: tasks.length > 0 ? Math.round((tasksInProgress / tasks.length) * 100) : 0, color: 'var(--color-status-warning)', display: `${tasksInProgress} tasks` },
                      { label: 'Overdue Ratio', value: tasks.length > 0 ? Math.round((overdueCount / tasks.length) * 100) : 0, color: 'var(--color-status-danger)', display: `${overdueCount} tasks` },
                    ].map((m) => (
                      <div key={m.label}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-[var(--color-text-muted)]">{m.label}</span>
                          <span className="font-semibold text-[var(--color-text-high)]">{m.display}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, m.value)}%`, background: m.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Row 5: Tasks Table ───────────────────────────────── */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3 flex-row items-center justify-between border-b border-[var(--color-border-subtle)]">
                <div>
                  <CardTitle>All Tasks</CardTitle>
                  <CardDescription>Latest {Math.min(recentTasks.length, 10)} of {tasks.length} tasks</CardDescription>
                </div>
                <Badge variant="outline">{tasks.length} total</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {recentTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <ListTodo className="h-10 w-10 text-[var(--color-text-muted)] mb-3 opacity-40" />
                    <p className="text-sm text-[var(--color-text-muted)]">No tasks available.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--color-border-subtle)]">
                          <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Task</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider hidden md:table-cell">Project</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Priority</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider hidden lg:table-cell">Due Date</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-subtle)]">
                        {recentTasks.map((task) => (
                          <tr key={task.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className={cn('h-7 w-7 rounded-full flex items-center justify-center shrink-0', task.status === 'done' ? 'bg-[var(--color-status-success)]/10' : task.status === 'in-progress' ? 'bg-[var(--color-status-warning)]/10' : 'bg-[var(--color-accent-primary)]/10')}>
                                  {task.status === 'done'
                                    ? <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-status-success)]" />
                                    : task.status === 'in-progress'
                                    ? <Clock className="h-3.5 w-3.5 text-[var(--color-status-warning)]" />
                                    : <ListTodo className="h-3.5 w-3.5 text-[var(--color-accent-primary)]" />}
                                </div>
                                <span className="font-medium text-[var(--color-text-high)] truncate max-w-[180px]">{task.title}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[var(--color-text-muted)] hidden md:table-cell">{task.project || 'General'}</td>
                            <td className="px-4 py-3">
                              <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'info'} className="capitalize">{task.priority}</Badge>
                            </td>
                            <td className="px-4 py-3 text-[var(--color-text-muted)] hidden lg:table-cell">{task.dueDate || '—'}</td>
                            <td className="px-4 py-3">
                              <Badge variant={task.status === 'done' ? 'success' : task.status === 'in-progress' ? 'warning' : 'info'} className="capitalize whitespace-nowrap">
                                {task.status === 'in-progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}

        {selectedReport === 'projects' && (
          <div className="flex flex-col gap-5">

            {/* ── Row 1: KPI Cards ────────────────────────────────── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="border-none shadow-sm bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-secondary)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[var(--color-accent-primary)]/5 pointer-events-none" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-[var(--color-accent-primary)]/10 flex items-center justify-center">
                      <Layers className="h-4 w-4 text-[var(--color-accent-primary)]" />
                    </div>
                    <Badge variant="info" className="text-xs">Total</Badge>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-accent-primary)] leading-tight">{projects.length}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">projects tracked</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-secondary)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[var(--color-status-success)]/5 pointer-events-none" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-[var(--color-status-success)]/10 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-[var(--color-status-success)]" />
                    </div>
                    <Badge variant="success" className="text-xs">On Track</Badge>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-status-success)] leading-tight">{projectsOnTrack + projectsActive}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">active or on track</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-secondary)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[var(--color-status-danger)]/5 pointer-events-none" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-[var(--color-status-danger)]/10 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-[var(--color-status-danger)]" />
                    </div>
                    <Badge variant="danger" className="text-xs">At Risk</Badge>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-status-danger)] leading-tight">{projectsAtRisk}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">need attention</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-secondary)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[var(--color-status-planning)]/5 pointer-events-none" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-[var(--color-status-planning)]/10 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-[var(--color-status-planning)]" />
                    </div>
                    <Badge variant="info" className="text-xs">Progress</Badge>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-status-planning)] leading-tight">{avgProgress}%</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">average completion</p>
                </CardContent>
              </Card>
            </div>

            {/* ── Row 2: Status Bar Chart ──────────────────────────── */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2 flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-[var(--color-accent-primary)]" />Project Status Distribution</CardTitle>
                  <CardDescription>Projects grouped by current stage</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
                  {[
                    { label: 'Planning', color: CHART_COLORS[0] },
                    { label: 'Active', color: CHART_COLORS[1] },
                    { label: 'On Track', color: CHART_COLORS[2] },
                    { label: 'At Risk', color: CHART_COLORS[3] },
                  ].map(s => (
                    <span key={s.label} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ background: s.color }} />{s.label}
                    </span>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="h-64">
                {projects.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-[var(--color-text-muted)]">No project data to display.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectsByStatus} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                      <XAxis dataKey="name" stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} />
                      <YAxis stroke="var(--color-text-muted)" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {projectsByStatus.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* ── Row 3: Status Donut + Stage Breakdown + Progress ─── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Status Donut */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle>Status Mix</CardTitle>
                  <CardDescription>Visual breakdown by stage</CardDescription>
                </CardHeader>
                <CardContent>
                  {projects.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-sm text-[var(--color-text-muted)]">No data.</div>
                  ) : (
                    <>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={projectsByStatus.filter(d => d.value > 0)} dataKey="value" innerRadius={50} outerRadius={72} paddingAngle={3} startAngle={90} endAngle={-270}>
                              {projectsByStatus.filter(d => d.value > 0).map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', borderRadius: 8, fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {projectsByStatus.map((item, i) => (
                          <div key={item.name} className="rounded-lg p-2 text-center" style={{ background: `${CHART_COLORS[i % CHART_COLORS.length]}15` }}>
                            <p className="text-xs text-[var(--color-text-muted)]">{item.name}</p>
                            <p className="text-sm font-bold mt-0.5" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Stage distribution bars */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2"><FolderKanban className="h-4 w-4 text-[var(--color-accent-primary)]" />Stage Breakdown</CardTitle>
                  <CardDescription>Project count per stage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {projectsByStatus.map((item, index) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: `${CHART_COLORS[index % CHART_COLORS.length]}22`, color: CHART_COLORS[index % CHART_COLORS.length] }}>{index + 1}</span>
                          <span className="text-[var(--color-text-main)]">{item.name}</span>
                        </div>
                        <span className="font-semibold text-[var(--color-text-high)]">{item.value} projects</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${projects.length > 0 ? (item.value / projects.length) * 100 : 0}%`, background: CHART_COLORS[index % CHART_COLORS.length] }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top progress */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[var(--color-status-success)]" />Top Progress</CardTitle>
                  <CardDescription>Projects by completion %</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topProjects.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">No data.</p>
                  ) : (
                    topProjects.slice(0, 5).map((project) => (
                      <div key={project.id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[var(--color-text-main)] truncate max-w-[140px]">{project.name}</span>
                          <span className={cn('font-semibold shrink-0 ml-2', project.progress >= 70 ? 'text-[var(--color-status-success)]' : project.progress >= 40 ? 'text-[var(--color-status-warning)]' : 'text-[var(--color-status-danger)]')}>{project.progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${project.progress}%`, background: project.progress >= 70 ? 'var(--color-status-success)' : project.progress >= 40 ? 'var(--color-status-warning)' : 'var(--color-status-danger)' }} />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Row 4: Project Health Score ──────────────────────── */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3 flex-row items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[var(--color-accent-primary)]/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-[var(--color-accent-primary)]" />
                </div>
                <div>
                  <CardTitle>Portfolio Health</CardTitle>
                  <CardDescription>Overall health of your project portfolio</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center justify-center gap-2 py-2">
                    <div className="relative h-28 w-28">
                      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-border-subtle)" strokeWidth="10" />
                        <circle cx="60" cy="60" r="50" fill="none"
                          stroke={projectHealthScore >= 70 ? 'var(--color-status-success)' : projectHealthScore >= 40 ? 'var(--color-status-warning)' : 'var(--color-status-danger)'}
                          strokeWidth="10"
                          strokeDasharray={`${(projectHealthScore / 100) * 314} 314`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-[var(--color-text-high)]">{projectHealthScore}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">/ 100</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text-high)]">Health Score</p>
                    <Badge variant={projectHealthScore >= 70 ? 'success' : projectHealthScore >= 40 ? 'warning' : 'danger'}>
                      {projectHealthScore >= 70 ? 'Healthy' : projectHealthScore >= 40 ? 'Moderate' : 'At Risk'}
                    </Badge>
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-4 justify-center">
                    {[
                      { label: 'Average Progress', value: avgProgress, display: `${avgProgress}%`, color: avgProgress >= 60 ? 'var(--color-status-success)' : avgProgress >= 30 ? 'var(--color-status-warning)' : 'var(--color-status-danger)' },
                      { label: 'At-Risk Ratio', value: projects.length > 0 ? Math.round((projectsAtRisk / projects.length) * 100) : 0, display: `${projectsAtRisk} projects`, color: 'var(--color-status-danger)' },
                      { label: 'On Track / Active', value: projects.length > 0 ? Math.round(((projectsOnTrack + projectsActive) / projects.length) * 100) : 0, display: `${projectsOnTrack + projectsActive} projects`, color: 'var(--color-status-success)' },
                    ].map((m) => (
                      <div key={m.label}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-[var(--color-text-muted)]">{m.label}</span>
                          <span className="font-semibold text-[var(--color-text-high)]">{m.display}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, m.value)}%`, background: m.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Row 5: Projects Table ────────────────────────────── */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3 flex-row items-center justify-between border-b border-[var(--color-border-subtle)]">
                <div>
                  <CardTitle>All Projects</CardTitle>
                  <CardDescription>Sorted by progress</CardDescription>
                </div>
                <Badge variant="outline">{projects.length} total</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {topProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <FolderKanban className="h-10 w-10 text-[var(--color-text-muted)] mb-3 opacity-40" />
                    <p className="text-sm text-[var(--color-text-muted)]">No projects available.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--color-border-subtle)]">
                          <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Project</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Status</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider hidden lg:table-cell">Progress</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-subtle)]">
                        {topProjects.map((project) => (
                          <tr key={project.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className={cn('h-7 w-7 rounded-full flex items-center justify-center shrink-0', project.status === 'at-risk' ? 'bg-[var(--color-status-danger)]/10' : project.status === 'planning' ? 'bg-[var(--color-status-warning)]/10' : 'bg-[var(--color-status-success)]/10')}>
                                  <FolderKanban className={cn('h-3.5 w-3.5', project.status === 'at-risk' ? 'text-[var(--color-status-danger)]' : project.status === 'planning' ? 'text-[var(--color-status-warning)]' : 'text-[var(--color-status-success)]')} />
                                </div>
                                <span className="font-medium text-[var(--color-text-high)] truncate max-w-[200px]">{project.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={project.status === 'at-risk' ? 'danger' : project.status === 'planning' ? 'warning' : project.status === 'on-track' ? 'success' : 'info'} className="capitalize">{project.status}</Badge>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <div className="flex items-center gap-2.5">
                                <div className="flex-1 h-2 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden min-w-[80px]">
                                  <div className="h-full rounded-full" style={{ width: `${project.progress}%`, background: project.progress >= 70 ? 'var(--color-status-success)' : project.progress >= 40 ? 'var(--color-status-warning)' : 'var(--color-status-danger)' }} />
                                </div>
                              </div>
                            </td>
                            <td className={cn('px-4 py-3 text-right font-semibold tabular-nums', project.progress >= 70 ? 'text-[var(--color-status-success)]' : project.progress >= 40 ? 'text-[var(--color-status-warning)]' : 'text-[var(--color-status-danger)]')}>
                              {project.progress}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}

        {selectedReport === 'finance' && (
          <div className="flex flex-col gap-5">

            {/* ── Row 1: KPI Cards ───────────────────────────── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Income */}
              <Card className="border-none shadow-sm bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-secondary)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[var(--color-status-success)]/5 pointer-events-none" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-[var(--color-status-success)]/10 flex items-center justify-center">
                      <ArrowUpRight className="h-4 w-4 text-[var(--color-status-success)]" />
                    </div>
                    <Badge variant="success" className="text-xs">Income</Badge>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-status-success)] leading-tight">{formatMoneyShort(totalIncome)}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{transactions.filter(t => t.type === 'income').length} transactions</p>
                </CardContent>
              </Card>

              {/* Expense */}
              <Card className="border-none shadow-sm bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-secondary)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[var(--color-status-danger)]/5 pointer-events-none" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-[var(--color-status-danger)]/10 flex items-center justify-center">
                      <ArrowDownRight className="h-4 w-4 text-[var(--color-status-danger)]" />
                    </div>
                    <Badge variant="danger" className="text-xs">Expense</Badge>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-status-danger)] leading-tight">{formatMoneyShort(totalExpense)}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{transactions.filter(t => t.type === 'expense').length} transactions</p>
                </CardContent>
              </Card>

              {/* Net Profit */}
              <Card className="border-none shadow-sm bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-secondary)] relative overflow-hidden">
                <div className={cn("absolute inset-0 pointer-events-none", netProfit >= 0 ? "bg-[var(--color-accent-primary)]/5" : "bg-[var(--color-status-warning)]/5")} />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", netProfit >= 0 ? "bg-[var(--color-accent-primary)]/10" : "bg-[var(--color-status-warning)]/10")}>
                      <Wallet className={cn("h-4 w-4", netProfit >= 0 ? "text-[var(--color-accent-primary)]" : "text-[var(--color-status-warning)]")} />
                    </div>
                    <Badge variant={netProfit >= 0 ? 'info' : 'warning'} className="text-xs">Net</Badge>
                  </div>
                  <p className={cn("text-2xl font-bold leading-tight", netProfit >= 0 ? "text-[var(--color-accent-primary)]" : "text-[var(--color-status-warning)]")}>
                    {netProfit >= 0 ? '+' : ''}{formatMoneyShort(netProfit)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">income − expense</p>
                </CardContent>
              </Card>

              {/* Savings Rate */}
              <Card className="border-none shadow-sm bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-secondary)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[var(--color-status-planning)]/5 pointer-events-none" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-[var(--color-status-planning)]/10 flex items-center justify-center">
                      <PiggyBank className="h-4 w-4 text-[var(--color-status-planning)]" />
                    </div>
                    <Badge variant="info" className="text-xs">Savings</Badge>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-status-planning)] leading-tight">{savingsRate}%</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">of total income saved</p>
                </CardContent>
              </Card>
            </div>

            {/* ── Row 2: Monthly Cashflow Chart ─────────────── */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2 flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-[var(--color-accent-primary)]" /> Monthly Cashflow</CardTitle>
                  <CardDescription>Income vs Expense trend — last 6 months</CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[var(--color-status-success)] inline-block" />Income</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[var(--color-status-danger)] inline-block" />Expense</span>
                </div>
              </CardHeader>
              <CardContent className="h-64">
                {transactions.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-[var(--color-text-muted)]">No transaction data to display.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyCashflow} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-status-success)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="var(--color-status-success)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-status-danger)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="var(--color-status-danger)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                      <XAxis dataKey="label" stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} />
                      <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} tickFormatter={(v: number) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(0)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                      <Tooltip formatter={(value) => [formatMoney((value as number) ?? 0)]} contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="income" stroke="var(--color-status-success)" strokeWidth={2} fill="url(#incomeGrad)" dot={{ r: 3, fill: 'var(--color-status-success)' }} />
                      <Area type="monotone" dataKey="expense" stroke="var(--color-status-danger)" strokeWidth={2} fill="url(#expenseGrad)" dot={{ r: 3, fill: 'var(--color-status-danger)' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* ── Row 3: Donut + Category Breakdown ─────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Income/Expense Donut */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle>Income vs Expense</CardTitle>
                  <CardDescription>Overall cashflow composition</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-sm text-[var(--color-text-muted)]">No data.</div>
                  ) : (
                    <>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Income', value: totalIncome },
                                { name: 'Expense', value: totalExpense },
                              ]}
                              dataKey="value"
                              innerRadius={50}
                              outerRadius={72}
                              paddingAngle={3}
                              startAngle={90}
                              endAngle={-270}
                            >
                              <Cell fill="var(--color-status-success)" />
                              <Cell fill="var(--color-status-danger)" />
                            </Pie>
                            <Tooltip formatter={(v) => formatMoney((v as number) ?? 0)} contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', borderRadius: 8, fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="rounded-lg bg-[var(--color-status-success)]/10 p-2.5 text-center">
                          <p className="text-xs text-[var(--color-text-muted)]">Income</p>
                          <p className="text-sm font-bold text-[var(--color-status-success)] mt-0.5">{totalIncome > 0 ? Math.round((totalIncome / (totalIncome + totalExpense)) * 100) : 0}%</p>
                        </div>
                        <div className="rounded-lg bg-[var(--color-status-danger)]/10 p-2.5 text-center">
                          <p className="text-xs text-[var(--color-text-muted)]">Expense</p>
                          <p className="text-sm font-bold text-[var(--color-status-danger)] mt-0.5">{totalIncome + totalExpense > 0 ? Math.round((totalExpense / (totalIncome + totalExpense)) * 100) : 0}%</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Top Income Categories */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[var(--color-status-success)]" />Top Income</CardTitle>
                  <CardDescription>Highest income sources</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cashflowByCategory.income.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">No income data.</p>
                  ) : (
                    cashflowByCategory.income.slice(0, 5).map((item, index) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: `${CHART_COLORS[index % CHART_COLORS.length]}22`, color: CHART_COLORS[index % CHART_COLORS.length] }}>{index + 1}</span>
                            <span className="text-[var(--color-text-main)] truncate">{item.name}</span>
                          </div>
                          <span className="font-semibold text-[var(--color-status-success)] shrink-0 ml-2">{formatMoneyShort(item.value)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                          <div className="h-full rounded-full bg-[var(--color-status-success)]" style={{ width: `${totalIncome > 0 ? (item.value / totalIncome) * 100 : 0}%`, opacity: 1 - index * 0.15 }} />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Top Expense Categories */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-[var(--color-status-danger)]" />Top Expenses</CardTitle>
                  <CardDescription>Highest spending categories</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cashflowByCategory.expense.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">No expense data.</p>
                  ) : (
                    cashflowByCategory.expense.slice(0, 5).map((item, index) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: 'rgba(244,63,94,0.12)', color: 'var(--color-status-danger)' }}>{index + 1}</span>
                            <span className="text-[var(--color-text-main)] truncate">{item.name}</span>
                          </div>
                          <span className="font-semibold text-[var(--color-status-danger)] shrink-0 ml-2">{formatMoneyShort(item.value)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                          <div className="h-full rounded-full bg-[var(--color-status-danger)]" style={{ width: `${totalExpense > 0 ? (item.value / totalExpense) * 100 : 0}%`, opacity: 1 - index * 0.15 }} />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Row 4: Financial Health ────────────────────── */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3 flex-row items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[var(--color-accent-primary)]/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-[var(--color-accent-primary)]" />
                </div>
                <div>
                  <CardTitle>Financial Health</CardTitle>
                  <CardDescription>Overall snapshot of your financial standing</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Health Score */}
                  <div className="flex flex-col items-center justify-center gap-2 py-2">
                    <div className="relative h-28 w-28">
                      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-border-subtle)" strokeWidth="10" />
                        <circle
                          cx="60" cy="60" r="50" fill="none"
                          stroke={healthScore >= 70 ? 'var(--color-status-success)' : healthScore >= 40 ? 'var(--color-status-warning)' : 'var(--color-status-danger)'}
                          strokeWidth="10"
                          strokeDasharray={`${(healthScore / 100) * 314} 314`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-[var(--color-text-high)]">{healthScore}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">/ 100</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text-high)]">Health Score</p>
                    <Badge variant={healthScore >= 70 ? 'success' : healthScore >= 40 ? 'warning' : 'danger'}>
                      {healthScore >= 70 ? 'Healthy' : healthScore >= 40 ? 'Moderate' : 'At Risk'}
                    </Badge>
                  </div>

                  {/* Metrics */}
                  <div className="md:col-span-2 flex flex-col gap-4 justify-center">
                    {[
                      { label: 'Savings Rate', value: savingsRate, max: 100, suffix: '%', color: savingsRate >= 20 ? 'var(--color-status-success)' : savingsRate >= 10 ? 'var(--color-status-warning)' : 'var(--color-status-danger)' },
                      { label: 'Expense Ratio', value: expenseRatio, max: 100, suffix: '%', color: expenseRatio <= 70 ? 'var(--color-status-success)' : expenseRatio <= 90 ? 'var(--color-status-warning)' : 'var(--color-status-danger)' },
                      { label: 'Transactions', value: Math.min(transactions.length, 100), max: 100, suffix: ` tx`, color: 'var(--color-accent-primary)' },
                    ].map((metric) => (
                      <div key={metric.label}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-[var(--color-text-muted)]">{metric.label}</span>
                          <span className="font-semibold text-[var(--color-text-high)]">{metric.label === 'Transactions' ? transactions.length : metric.value}{metric.label === 'Transactions' ? ' tx' : '%'}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${(metric.value / metric.max) * 100}%`, background: metric.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Row 5: Transactions Table ─────────────────── */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3 flex-row items-center justify-between border-b border-[var(--color-border-subtle)]">
                <div>
                  <CardTitle>Latest Transactions</CardTitle>
                  <CardDescription>Most recent {Math.min(recentTransactions.length, 10)} of {transactions.length} records</CardDescription>
                </div>
                <Badge variant="outline">{transactions.length} total</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {recentTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Wallet className="h-10 w-10 text-[var(--color-text-muted)] mb-3 opacity-40" />
                    <p className="text-sm text-[var(--color-text-muted)]">No transaction data available.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--color-border-subtle)]">
                          <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Description</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider hidden md:table-cell">Category</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider hidden lg:table-cell">Bank / Source</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Date</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Type</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-subtle)]">
                        {recentTransactions.slice(0, 10).map((t) => {
                          const title = t.title || 'Transaction';
                          const category = t.sourceOrCategory || '—';
                          const bank = t.bank || '—';
                          return (
                            <tr key={t.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0", t.type === 'income' ? "bg-[var(--color-status-success)]/10" : "bg-[var(--color-status-danger)]/10")}>
                                    {t.type === 'income'
                                      ? <ArrowUpRight className="h-3.5 w-3.5 text-[var(--color-status-success)]" />
                                      : <ArrowDownRight className="h-3.5 w-3.5 text-[var(--color-status-danger)]" />}
                                  </div>
                                  <span className="font-medium text-[var(--color-text-high)] truncate max-w-[140px]">{title}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-[var(--color-text-muted)] hidden md:table-cell">{category}</td>
                              <td className="px-4 py-3 text-[var(--color-text-muted)] hidden lg:table-cell">{bank}</td>
                              <td className="px-4 py-3 text-[var(--color-text-muted)] whitespace-nowrap">{t.date ? new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                              <td className="px-4 py-3">
                                <Badge variant={t.type === 'income' ? 'success' : 'danger'} className="capitalize">{t.type}</Badge>
                              </td>
                              <td className={cn("px-4 py-3 text-right font-semibold tabular-nums", t.type === 'income' ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-danger)]')}>
                                {t.type === 'income' ? '+' : '−'}{formatMoney(t.amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </AppLayout>
  );
}
