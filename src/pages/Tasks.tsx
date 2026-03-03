import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { SidePanel } from '@/components/ui/SidePanel';
import { Dropdown } from '@/components/ui/Dropdown';
import { PageHeader } from '@/components/ui/PageHeader';
import { Plus, LayoutGrid, List, Calendar, Tag, CheckCircle2, Trash2, FileText, Clock, User, Paperclip, Search, BarChart3, AlertCircle, ChevronDown, Pencil } from 'lucide-react';
import { cn } from '@/components/ui/Button';
import { useProjectNames } from '@/contexts/ProjectsContext';
import { useApiData } from '@/contexts/ApiDataContext';
import { TaskKanban } from '@/components/ui/TaskKanban';

type TaskItem = {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  project: string;
  dueDate: string;
  dueDateISO?: string;
  description?: string;
};

export default function Tasks() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { projectNames } = useProjectNames();
  const { tasks, addTask, updateTask, deleteTask } = useApiData();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [showAddTask, setShowAddTask] = useState(false);
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active'>('all');
  const [groupBy, setGroupBy] = useState<'none' | 'status' | 'priority' | 'project'>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const [viewingTask, setViewingTask] = useState<TaskItem | null>(null);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTaskProject, setNewTaskProject] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<'todo' | 'in-progress' | 'done'>('todo');

  const projectFromUrl = searchParams.get('project');
  useEffect(() => {
    if (projectFromUrl != null && projectFromUrl.trim() !== '') {
      setNewTaskProject(projectFromUrl.trim());
      setShowAddTask(true);
      setSearchParams({}, { replace: true });
    }
  }, [projectFromUrl]);

  // Populate form when viewing task changes
  useEffect(() => {
    if (viewingTask) {
      setNewTaskTitle(viewingTask.title);
      setNewTaskDesc(viewingTask.description || '');
      setNewTaskDue(viewingTask.dueDateISO || '');
      setNewTaskPriority(viewingTask.priority);
      setNewTaskProject(viewingTask.project || '');
      setNewTaskStatus(viewingTask.status);
    }
  }, [viewingTask]);

  const resetTaskForm = () => {
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskDue('');
    setNewTaskPriority('medium');
    setNewTaskProject('');
    setNewTaskStatus('todo');
    setShowAddTask(false);
    setEditingTask(null);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    if (editingTask) {
      await updateTask(editingTask.id, {
        title: newTaskTitle.trim(),
        status: newTaskStatus,
        priority: newTaskPriority,
        project: newTaskProject || 'General',
        dueDateISO: newTaskDue || undefined,
        description: newTaskDesc.trim() || undefined,
      });
    } else {
      await addTask({
        title: newTaskTitle.trim(),
        status: newTaskStatus,
        priority: newTaskPriority,
        project: newTaskProject || 'General',
        dueDate: newTaskDue ? new Date(newTaskDue).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : undefined,
        dueDateISO: newTaskDue || undefined,
        description: newTaskDesc.trim() || undefined,
      });
    }
    resetTaskForm();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
    }
  };

  const handleSaveDetailModalEdit = async () => {
    if (!newTaskTitle.trim() || !viewingTask) return;

    await updateTask(viewingTask.id, {
      title: newTaskTitle.trim(),
      status: newTaskStatus,
      priority: newTaskPriority,
      project: newTaskProject || 'General',
      dueDateISO: newTaskDue || undefined,
      description: newTaskDesc.trim() || undefined,
    });
    setViewingTask(null);
  };

  const filteredTasks = filterPriority === 'all'
    ? tasks
    : tasks.filter((task) => task.priority === filterPriority);

  const searchedTasks = searchQuery
    ? filteredTasks.filter((task) => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.project.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredTasks;

  const tabFilteredTasks = activeTab === 'active'
    ? searchedTasks.filter((task) => task.status !== 'done')
    : searchedTasks;

  const displayTasks = tabFilteredTasks;

  // Summary stats
  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const overdueTasks = tasks.filter((t) => 
    t.dueDateISO && new Date(t.dueDateISO) < new Date() && t.status !== 'done'
  ).length;

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const columns = [
    { id: 'todo', title: t('tasks.todo'), color: 'bg-[var(--color-status-info)]' },
    { id: 'in-progress', title: t('tasks.inProgress'), color: 'bg-[var(--color-status-warning)]' },
    { id: 'done', title: t('tasks.done'), color: 'bg-[var(--color-status-success)]' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('application/json', JSON.stringify({ taskId }));
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumnId(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumnId(columnId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverColumnId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskItem['status']) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
    let taskId: string;
    try {
      const data = JSON.parse(raw);
      taskId = data.taskId ?? raw;
    } catch {
      taskId = raw;
    }
    if (!taskId) return;
    await updateTask(taskId, { status: targetStatus });
    setDraggedTaskId(null);
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title={t('tasks.title')}
          description={t('tasks.description')}
          actions={
            <Button className="shrink-0 h-9" onClick={() => setShowAddTask(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('tasks.addTask')}
            </Button>
          }
        />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row gap-4 mb-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('tasks.addTaskPlaceholder')}
                className="pl-9 h-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('all')}
                className={cn(
                  "h-9 transition-all",
                  activeTab === 'all' && "ring-2 ring-[var(--color-accent-primary)] shadow-lg"
                )}
              >
                {t('tasks.allTasks')}
              </Button>
              <Button
                variant={activeTab === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('active')}
                className={cn(
                  "h-9 transition-all",
                  activeTab === 'active' && "ring-2 ring-[var(--color-accent-primary)] shadow-lg"
                )}
              >
                {t('tasks.activeTasks')}
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
            <Card className="border-[var(--color-border-subtle)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{t('tasks.totalTasks')}</p>
                    <p className="text-2xl font-bold text-[var(--color-text-high)] mt-1">{totalTasks}</p>
                  </div>
                  <div className="h-9 w-10 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-[var(--color-text-muted)]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--color-border-subtle)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{t('tasks.todoCount')}</p>
                    <p className="text-2xl font-bold text-[var(--color-text-high)] mt-1">{todoTasks}</p>
                  </div>
                  <div className="h-9 w-10 rounded-lg bg-[var(--color-status-info)]/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-[var(--color-status-info)]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--color-border-subtle)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{t('tasks.inProgressCount')}</p>
                    <p className="text-2xl font-bold text-[var(--color-text-high)] mt-1">{inProgressTasks}</p>
                  </div>
                  <div className="h-9 w-10 rounded-lg bg-[var(--color-status-warning)]/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-[var(--color-status-warning)]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--color-border-subtle)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{t('tasks.doneCount')}</p>
                    <p className="text-2xl font-bold text-[var(--color-text-high)] mt-1">{doneTasks}</p>
                  </div>
                  <div className="h-9 w-10 rounded-lg bg-[var(--color-status-success)]/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-[var(--color-status-success)]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--color-border-subtle)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{t('tasks.overdueCount')}</p>
                    <p className="text-2xl font-bold text-[var(--color-status-danger)] mt-1">{overdueTasks}</p>
                  </div>
                  <div className="h-9 w-10 rounded-lg bg-[var(--color-status-danger)]/10 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-[var(--color-status-danger)]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* View Controls and Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'high', 'medium', 'low'] as const).map((p) => {
                  const getRingColor = () => {
                    if (filterPriority !== p) return '';
                    if (p === 'high') return 'ring-2 ring-[var(--color-status-danger)] shadow-md';
                    if (p === 'medium') return 'ring-2 ring-[var(--color-status-warning)] shadow-md';
                    if (p === 'low') return 'ring-2 ring-[var(--color-status-info)] shadow-md';
                    return 'ring-2 ring-[var(--color-accent-primary)] shadow-md';
                  };
                  return (
                    <Button
                      key={p}
                      variant={filterPriority === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterPriority(p)}
                      className={cn(
                        "capitalize h-8 transition-all",
                        getRingColor()
                      )}
                    >
                      {p === 'all' ? t('tasks.filterPriority') : p}
                    </Button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {view === 'list' && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-[var(--color-text-muted)]">{t('tasks.groupBy')}:</span>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as any)}
                    className={cn(
                      "h-9 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)] focus:ring-2 focus:ring-[var(--color-accent-primary)] transition-all",
                      groupBy !== 'none' && "ring-2 ring-[var(--color-accent-primary)] shadow-md"
                    )}
                  >
                    <option value="none">{t('tasks.groupByNone')}</option>
                    <option value="status">{t('tasks.groupByStatus')}</option>
                    <option value="priority">{t('tasks.groupByPriority')}</option>
                    <option value="project">{t('tasks.groupByProject')}</option>
                  </select>
                </div>
              )}

              <div className="flex items-center bg-[var(--color-bg-secondary)] rounded-lg p-1 border border-[var(--color-border-subtle)] h-9">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn("h-7 px-2", view === 'kanban' && "bg-[var(--color-bg-elevated)] text-[var(--color-text-high)] shadow-sm")}
                  onClick={() => setView('kanban')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn("h-7 px-2", view === 'list' && "bg-[var(--color-bg-elevated)] text-[var(--color-text-high)] shadow-sm")}
                  onClick={() => setView('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2"
                  onClick={() => navigate('/calendar')}
                  title="View in calendar"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
              
            </div>
          </div>
        </div>

        <Modal open={showAddTask} onClose={resetTaskForm} title={editingTask ? t('tasks.editTask') : t('tasks.newTask')} maxWidth="max-w-md">
          <form onSubmit={handleAddTask} className="space-y-4">
            <Input label={t('tasks.taskTitle')} placeholder={t('tasks.addTaskPlaceholder')} value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} required />
            <Textarea label={t('tasks.taskDescription')} placeholder={t('tasks.descriptionPlaceholder')} value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} rows={2} />
            <div>
              <label className="text-sm font-medium text-[var(--color-text-main)] block mb-1.5">{t('tasks.taskDueDate')}</label>
              <Input type="date" value={newTaskDue} onChange={(e) => setNewTaskDue(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium text-[var(--color-text-main)] block mb-1.5">{t('tasks.taskPriority')}</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
                  className="w-full h-9 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)] focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                >
                  <option value="low">{t('tasks.lowPriority')}</option>
                  <option value="medium">{t('tasks.mediumPriority')}</option>
                  <option value="high">{t('tasks.highPriority')}</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-main)] block mb-1.5">{t('tasks.taskStatus')}</label>
                <select
                  value={newTaskStatus}
                  onChange={(e) => setNewTaskStatus(e.target.value as 'todo' | 'in-progress' | 'done')}
                  className="w-full h-9 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)] focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                >
                  <option value="todo">{t('tasks.todo')}</option>
                  <option value="in-progress">{t('tasks.inProgress')}</option>
                  <option value="done">{t('tasks.done')}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-main)] block mb-1.5">{t('tasks.taskProject')}</label>
              <select
                value={newTaskProject}
                onChange={(e) => setNewTaskProject(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)] focus:ring-2 focus:ring-[var(--color-accent-primary)]"
              >
                <option value="">{`— ${t('common.none')}`}</option>
                {projectNames.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{t('tasks.taskProject')}.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">{editingTask ? t('common.update') : t('common.create')}</Button>
              <Button type="button" variant="outline" onClick={resetTaskForm}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>

        {/* Task Detail Panel - Detail View with Click-to-Edit */}
        {viewingTask && (
          <SidePanel 
            open={!!viewingTask} 
            onClose={() => { setViewingTask(null); setEditingField(null); }} 
            title="Task Details"
          >
            <div className="flex flex-col gap-2.5">
              {/* Title */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                  <FileText className="h-3 w-3" />
                  <span>{t('tasks.taskTitle').toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => setEditingField(editingField === 'title' ? null : 'title')}
                    className="ml-auto p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-high)] transition-colors"
                    title="Edit title"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
                {editingField === 'title' ? (
                  <Input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onBlur={() => { handleSaveDetailModalEdit(); setEditingField(null); }}
                    autoFocus
                    className="text-base font-semibold border-2 border-[var(--color-accent-primary)] bg-[var(--color-bg-elevated)] px-2.5 py-1.5"
                  />
                ) : (
                  <div className="bg-[var(--color-bg-elevated)] px-2.5 py-1.5 rounded-lg text-base font-semibold text-[var(--color-text-high)] cursor-pointer hover:bg-[var(--color-bg-hover)]" onClick={() => setEditingField('title')}>
                    {newTaskTitle || t('common.untitled')}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{t('tasks.taskStatus').toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => setEditingField(editingField === 'status' ? null : 'status')}
                    className="ml-auto p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-high)] transition-colors"
                    title="Edit status"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
                {editingField === 'status' ? (
                  <select
                    value={newTaskStatus}
                    onChange={(e) => { setNewTaskStatus(e.target.value as 'todo' | 'in-progress' | 'done'); handleSaveDetailModalEdit(); setEditingField(null); }}
                    autoFocus
                    className="w-full h-9 rounded-lg border-2 border-[var(--color-accent-primary)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)]"
                  >
                    <option value="todo">{t('tasks.todo')}</option>
                    <option value="in-progress">{t('tasks.inProgress')}</option>
                    <option value="done">{t('tasks.done')}</option>
                  </select>
                ) : (
                  <Badge 
                    variant={
                      newTaskStatus === 'done' ? 'success' : 
                      newTaskStatus === 'in-progress' ? 'warning' : 
                      'info'
                    } 
                    className="text-sm font-medium px-3 py-1.5 cursor-pointer hover:opacity-80"
                    onClick={() => setEditingField('status')}
                  >
                    {newTaskStatus === 'done' ? t('tasks.done') : newTaskStatus === 'in-progress' ? t('tasks.inProgress') : t('tasks.todo')}
                  </Badge>
                )}
              </div>

              {/* Priority with Dropdown */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                  <AlertCircle className="h-3 w-3" />
                  <span>{t('tasks.taskPriority').toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => setEditingField(editingField === 'priority' ? null : 'priority')}
                    className="ml-auto p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-high)] transition-colors"
                    title="Edit priority"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
                {editingField === 'priority' ? (
                  <div className="flex gap-2">
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
                      autoFocus
                      className="flex-1 h-9 rounded-lg border-2 border-[var(--color-accent-primary)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)]"
                    >
                      <option value="low">{t('tasks.lowPriority')}</option>
                      <option value="medium">{t('tasks.mediumPriority')}</option>
                      <option value="high">{t('tasks.highPriority')}</option>
                    </select>
                    <Button
                      onClick={() => { handleSaveDetailModalEdit(); setEditingField(null); }}
                      className="px-4 h-9 text-sm"
                    >
                      {t('common.save')}
                    </Button>
                  </div>
                ) : (
                  <Badge 
                    variant={newTaskPriority === 'high' ? 'danger' : newTaskPriority === 'medium' ? 'warning' : 'info'}
                    className="text-sm font-medium px-3 py-1.5 cursor-pointer hover:opacity-80 capitalize"
                    onClick={() => setEditingField('priority')}
                  >
                    {newTaskPriority}
                  </Badge>
                )}
              </div>

              {/* Project */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                  <Tag className="h-3 w-3" />
                  <span>{t('tasks.taskProject').toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => setEditingField(editingField === 'project' ? null : 'project')}
                    className="ml-auto p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-high)] transition-colors"
                    title="Edit project"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
                {editingField === 'project' ? (
                  <select
                    value={newTaskProject}
                    onChange={(e) => { setNewTaskProject(e.target.value); handleSaveDetailModalEdit(); setEditingField(null); }}
                    autoFocus
                    className="w-full h-9 rounded-lg border-2 border-[var(--color-accent-primary)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)]"
                  >
                    <option value="">{`— ${t('common.none')}`}</option>
                    {projectNames.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-[var(--color-bg-elevated)] px-2.5 py-1.5 rounded-lg text-sm text-[var(--color-text-high)] cursor-pointer hover:bg-[var(--color-bg-hover)]" onClick={() => setEditingField('project')}>
                    {newTaskProject || t('common.general')}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                  <FileText className="h-3 w-3" />
                  <span>{t('tasks.taskDescription').toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => setEditingField(editingField === 'description' ? null : 'description')}
                    className="ml-auto p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-high)] transition-colors"
                    title="Edit description"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
                {editingField === 'description' ? (
                  <Textarea
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    onBlur={() => { handleSaveDetailModalEdit(); setEditingField(null); }}
                    placeholder={t('tasks.descriptionPlaceholder')}
                    rows={5}
                    autoFocus
                    className="bg-[var(--color-bg-elevated)] border-2 border-[var(--color-accent-primary)] text-sm"
                  />
                ) : (
                  <div className="bg-[var(--color-bg-elevated)] px-2.5 py-1.5 rounded-lg text-sm text-[var(--color-text-main)] cursor-pointer hover:bg-[var(--color-bg-hover)] min-h-[100px]" onClick={() => setEditingField('description')}>
                    {newTaskDesc || <span className="text-[var(--color-text-muted)] italic">{t('tasks.noDescription')}</span>}
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                  <Clock className="h-3 w-3" />
                  <span>{t('tasks.taskDueDate').toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => setEditingField(editingField === 'dueDate' ? null : 'dueDate')}
                    className="ml-auto p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-high)] transition-colors"
                    title="Edit due date"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
                {editingField === 'dueDate' ? (
                  <Input
                    type="date"
                    value={newTaskDue}
                    onChange={(e) => { setNewTaskDue(e.target.value); handleSaveDetailModalEdit(); setEditingField(null); }}
                    autoFocus
                    className="border-2 border-[var(--color-accent-primary)] bg-[var(--color-bg-elevated)] px-2.5 py-1.5 text-sm"
                  />
                ) : (
                  <div className="bg-[var(--color-bg-elevated)] px-2.5 py-1.5 rounded-lg text-sm text-[var(--color-text-high)] cursor-pointer hover:bg-[var(--color-bg-hover)]" onClick={() => setEditingField('dueDate')}>
                    {newTaskDue ? new Date(newTaskDue).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : t('common.notSet')}
                  </div>
                )}
              </div>

              {/* Task ID */}
              <div className="pt-2 border-t border-[var(--color-border-subtle)]">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  <Paperclip className="h-3 w-3" />
                  <span>{t('tasks.taskId').toUpperCase()}</span>
                </div>
                <div className="text-base font-semibold text-[var(--color-text-high)] mt-1">
                  #{viewingTask.id}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    handleDeleteTask(viewingTask.id);
                    setViewingTask(null);
                  }}
                  className="text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger)]/10 h-9 w-10"
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => {
                    handleSaveDetailModalEdit();
                  }}
                  className="flex-1 h-9 text-sm"
                >
                  {t('common.save')}
                </Button>
              </div>
            </div>
          </SidePanel>
        )}

        {/* Content Area: Kanban/List */}
        <div className="min-h-0">
          {view === 'kanban' ? (
            <TaskKanban 
              tasks={displayTasks}
              onStatusChange={(id, status) => updateTask(id, { status })}
              onTaskClick={(id) => {
                const t = tasks.find(x => x.id === id);
                if (t) setViewingTask(t);
              }}
              onDeleteTask={handleDeleteTask}
            />
          ) : (
            <div className="flex flex-col">
              <div className="grid grid-cols-12 gap-4 px-6 py-3.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide border-b-2 border-[var(--color-border-strong)] sticky top-0 bg-[var(--color-bg-primary)] z-10">
                <div className="col-span-5 pl-8">{t('tasks.taskTitle')}</div>
                <div className="col-span-2 hidden sm:block text-center">{t('tasks.taskStatus')}</div>
                <div className="col-span-2 hidden md:block">{t('tasks.taskProject')}</div>
                <div className="col-span-2">{t('tasks.taskDueDate')}</div>
                <div className="col-span-1 text-center">{t('tasks.taskPriority')}</div>
              </div>
              
              <div className="px-3 py-3">
                {groupBy === 'none' ? (
                  <div className="space-y-1">
                    {displayTasks.map(task => {
                      const isOverdue = task.dueDateISO ? new Date(task.dueDateISO) < new Date() && task.status !== 'done' : false;
                      return (
                        <div 
                          key={task.id} 
                          onClick={() => setViewingTask(task)}
                          className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-strong)] hover:shadow-sm transition-all duration-200 group cursor-pointer"
                        >
                          <div className="col-span-5 flex items-center gap-2">
                            <div className={cn(
                              "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                              task.status === 'done' 
                                ? "bg-[var(--color-status-success)] border-[var(--color-status-success)]" 
                                : "border-[var(--color-border-strong)] group-hover:border-[var(--color-accent-primary)]"
                            )}>
                              {task.status === 'done' && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={cn(
                                "text-sm font-medium truncate leading-tight",
                                task.status === 'done' ? "text-[var(--color-text-muted)] line-through" : "text-[var(--color-text-high)]"
                              )}>
                                {task.title}
                              </div>
                              {task.description && (
                                <div className="text-xs text-[var(--color-text-muted)] truncate mt-1">
                                  {task.description}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="col-span-2 hidden sm:flex justify-center items-center">
                            <Badge 
                              variant={
                                task.status === 'done' ? 'success' : 
                                task.status === 'in-progress' ? 'warning' : 
                                'info'
                              } 
                              className="text-[11px] font-medium px-3 py-1.5 rounded-md"
                            >
                              {task.status === 'done' ? 'Done' : task.status === 'in-progress' ? 'In Progress' : 'To Do'}
                            </Badge>
                          </div>
                          
                          <div className="col-span-2 hidden md:flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                            <Tag className="h-3 w-3 opacity-60" />
                            <span className="truncate font-medium">{task.project}</span>
                          </div>
                          
                          <div className="col-span-2 flex items-center gap-2">
                            <div className={cn(
                              "flex items-center gap-2 text-xs px-3 py-1.5 rounded-md font-medium",
                              isOverdue 
                                ? "text-[var(--color-status-danger)] bg-[var(--color-status-danger)]/10" 
                                : "text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)]"
                            )}>
                              <Calendar className="h-3 w-3" />
                              <span className="truncate">{task.dueDate}</span>
                            </div>
                          </div>
                          
                          <div className="col-span-1 flex justify-center items-center">
                            <Badge 
                              variant={getPriorityColor(task.priority) as any} 
                              className="text-[11px] font-medium px-3 py-1.5 rounded-md"
                            >
                              {task.priority === 'high' ? t('tasks.highPriority') : task.priority === 'medium' ? t('tasks.mediumPriority') : t('tasks.lowPriority')}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      const groups: Record<string, TaskItem[]> = {};
                      displayTasks.forEach((task) => {
                        let key = '';
                        if (groupBy === 'status') {
                          key = task.status === 'todo' ? t('tasks.todo') : task.status === 'in-progress' ? t('tasks.inProgress') : t('tasks.done');
                        } else if (groupBy === 'priority') {
                          key = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
                        } else if (groupBy === 'project') {
                          key = task.project || t('common.general');
                        }
                        if (!groups[key]) groups[key] = [];
                        groups[key].push(task);
                      });

                      return Object.entries(groups).map(([groupName, groupTasks]) => (
                        <div key={groupName}>
                          <div className="flex items-center gap-2 px-4 mb-3">
                            <button
                              type="button"
                              onClick={() => toggleGroup(groupName)}
                              className="h-6 w-6 inline-flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-high)] hover:bg-[var(--color-bg-hover)] transition-all"
                              aria-label={`Toggle ${groupName}`}
                            >
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform duration-200",
                                  collapsedGroups[groupName] && "-rotate-90"
                                )}
                              />
                            </button>
                            <div className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              groupBy === 'status' && groupName === 'To Do' && "bg-[var(--color-status-info)]",
                              groupBy === 'status' && groupName === 'In Progress' && "bg-[var(--color-status-warning)]",
                              groupBy === 'status' && groupName === 'Done' && "bg-[var(--color-status-success)]",
                              groupBy === 'priority' && groupName === 'High' && "bg-[var(--color-status-danger)]",
                              groupBy === 'priority' && groupName === 'Medium' && "bg-[var(--color-status-warning)]",
                              groupBy === 'priority' && groupName === 'Low' && "bg-[var(--color-status-info)]",
                              groupBy === 'project' && "bg-[var(--color-accent-primary)]"
                            )} />
                            <h3 className="text-sm font-semibold text-[var(--color-text-high)] uppercase tracking-wide">
                              {groupName}
                            </h3>
                            <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] px-2 py-0.5 rounded-full">
                              {groupTasks.length}
                            </span>
                          </div>
                          <div 
                            className={cn(
                              "space-y-1 border-l-2 pl-4 ml-3 transition-all duration-300 origin-top",
                              collapsedGroups[groupName] ? "hidden opacity-0" : "opacity-100",
                              groupBy === 'status' && groupName === 'To Do' && "border-[var(--color-status-info)]",
                              groupBy === 'status' && groupName === 'In Progress' && "border-[var(--color-status-warning)]",
                              groupBy === 'status' && groupName === 'Done' && "border-[var(--color-status-success)]",
                              groupBy === 'priority' && groupName === 'High' && "border-[var(--color-status-danger)]",
                              groupBy === 'priority' && groupName === 'Medium' && "border-[var(--color-status-warning)]",
                              groupBy === 'priority' && groupName === 'Low' && "border-[var(--color-status-info)]",
                              groupBy === 'project' && "border-[var(--color-accent-primary)]"
                            )}
                          >
                              {groupTasks.map(task => {
                              const isOverdue = task.dueDateISO ? new Date(task.dueDateISO) < new Date() && task.status !== 'done' : false;
                              return (
                                <div 
                                  key={task.id} 
                                  onClick={() => setViewingTask(task)}
                                  className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-strong)] hover:shadow-sm transition-all duration-200 group cursor-pointer"
                                >
                                  <div className="col-span-5 flex items-center gap-2">
                                    <div className={cn(
                                      "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                      task.status === 'done' 
                                        ? "bg-[var(--color-status-success)] border-[var(--color-status-success)]" 
                                        : "border-[var(--color-border-strong)] group-hover:border-[var(--color-accent-primary)]"
                                    )}>
                                      {task.status === 'done' && <CheckCircle2 className="h-3 w-3 text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className={cn(
                                        "text-sm font-medium truncate leading-tight",
                                        task.status === 'done' ? "text-[var(--color-text-muted)] line-through" : "text-[var(--color-text-high)]"
                                      )}>
                                        {task.title}
                                      </div>
                                      {task.description && (
                                        <div className="text-xs text-[var(--color-text-muted)] truncate mt-1">
                                          {task.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="col-span-2 hidden sm:flex justify-center items-center">
                                    <Badge 
                                      variant={
                                        task.status === 'done' ? 'success' : 
                                        task.status === 'in-progress' ? 'warning' : 
                                        'info'
                                      } 
                                      className="text-[11px] font-medium px-3 py-1.5 rounded-md"
                                    >
                                      {task.status === 'done' ? t('tasks.done') : task.status === 'in-progress' ? t('tasks.inProgress') : t('tasks.todo')}
                                    </Badge>
                                  </div>
                                  
                                  <div className="col-span-2 hidden md:flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                                    <Tag className="h-3 w-3 opacity-60" />
                                    <span className="truncate font-medium">{task.project}</span>
                                  </div>
                                  
                                  <div className="col-span-2 flex items-center gap-2">
                                    <div className={cn(
                                      "flex items-center gap-2 text-xs px-3 py-1.5 rounded-md font-medium",
                                      isOverdue 
                                        ? "text-[var(--color-status-danger)] bg-[var(--color-status-danger)]/10" 
                                        : "text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)]"
                                    )}>
                                      <Calendar className="h-3 w-3" />
                                      <span className="truncate">{task.dueDate}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="col-span-1 flex justify-center items-center">
                                    <Badge 
                                      variant={getPriorityColor(task.priority) as any} 
                                      className="text-[11px] font-medium px-3 py-1.5 rounded-md"
                                    >
                                      {task.priority === 'high' ? t('tasks.highPriority') : task.priority === 'medium' ? t('tasks.mediumPriority') : t('tasks.lowPriority')}
                                    </Badge>
                                  </div>
                                </div>
                              );
                              })}
                            </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
