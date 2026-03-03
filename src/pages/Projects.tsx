import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { SidePanel } from '@/components/ui/SidePanel';
import { Plus, FolderKanban, Trash2, Calendar, Pencil, FileText, CheckCircle2, Clock, BarChart3, Tag, Paperclip, Search, LayoutGrid, List, AlertCircle } from 'lucide-react';
import { useProjectNames } from '@/contexts/ProjectsContext';
import { useApiData } from '@/contexts/ApiDataContext';
import { cn } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

type ProjectStatus = 'active' | 'planning' | 'on-track' | 'at-risk';
type ProjectItem = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus | string;
  progress: number;
  dueDate: string;
  team: number;
  tasks: { total: number; completed: number };
  color: string;
};

export default function Projects() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { projectNames } = useProjectNames();
  const { projects: projectsList, tasks: allTasks, loading, addProject, updateProject, deleteProject } = useApiData();

  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectDue, setNewProjectDue] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState<ProjectStatus>('active');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [projectFilterStatus, setProjectFilterStatus] = useState<'all' | ProjectStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getLinkedTasks = (projectName: string) => allTasks.filter((task) => (task.project || '').trim() === projectName.trim());

  const getDerivedProgress = (project: ProjectItem) => {
    const linked = getLinkedTasks(project.name);
    const total = linked.length;
    const completed = linked.filter((task) => task.status === 'done').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : project.progress;
    return { total, completed, progress };
  };

  const totalProjects = projectsList.length;
  const planningProjects = projectsList.filter((p) => p.status === 'planning').length;
  const activeProjects = projectsList.filter((p) => p.status === 'active' || p.status === 'on-track').length;
  const doneProjects = projectsList.filter((p) => getDerivedProgress(p).progress === 100).length;
  const atRiskProjects = projectsList.filter((p) => p.status === 'at-risk').length;

  const handleAddProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    await addProject({
      name: newProjectName.trim(),
      description: newProjectDesc.trim(),
      status: newProjectStatus,
      dueDate: newProjectDue || undefined,
    });
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectDue('');
    setNewProjectStatus('active');
    setShowNewProject(false);
  };

  const selectedProject = projectsList.find((p) => p.id === selectedProjectId) || null;
  const selectedDerived = selectedProject ? getDerivedProgress(selectedProject) : null;
  const selectedLinked = selectedProject ? getLinkedTasks(selectedProject.name) : [];
  const visibleProjects = useMemo(() => {
    const byStatus = projectFilterStatus === 'all' ? projectsList : projectsList.filter((p) => p.status === projectFilterStatus);
    if (!searchQuery.trim()) return byStatus;
    const q = searchQuery.trim().toLowerCase();
    return byStatus.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }, [projectFilterStatus, projectsList, searchQuery]);

  const handleUpdateProject = async (projectId: string, updates: Partial<ProjectItem>) => {
    await updateProject(projectId, updates);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    setDeleteConfirmId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="info">{t('projects.active')}</Badge>;
      case 'on-track': return <Badge variant="success">{t('projects.onTrack')}</Badge>;
      case 'at-risk': return <Badge variant="danger">{t('projects.atRisk')}</Badge>;
      case 'planning': return <Badge variant="warning">{t('projects.planning')}</Badge>;
      default: return <Badge variant="default">{t('common.unknown')}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title={t('projects.title')}
          description={t('projects.description')}
          actions={
            <>
              <Button className="shrink-0" onClick={() => setShowNewProject(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('projects.newProject')}
              </Button>
            </>
          }
        />

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="border-[var(--color-border-subtle)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{t('projects.total')}</p>
                  <p className="text-2xl font-bold text-[var(--color-text-high)] mt-1">{totalProjects}</p>
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
                  <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{t('projects.planning')}</p>
                  <p className="text-2xl font-bold text-[var(--color-text-high)] mt-1">{planningProjects}</p>
                </div>
                <div className="h-9 w-10 rounded-lg bg-[var(--color-status-planning-bg)] flex items-center justify-center">
                  <Clock className="h-5 w-5 text-[var(--color-status-planning)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--color-border-subtle)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{t('projects.active')}</p>
                  <p className="text-2xl font-bold text-[var(--color-text-high)] mt-1">{activeProjects}</p>
                </div>
                <div className="h-9 w-10 rounded-lg bg-[var(--color-status-info)]/10 flex items-center justify-center">
                  <FolderKanban className="h-5 w-5 text-[var(--color-status-info)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--color-border-subtle)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{t('projects.done')}</p>
                  <p className="text-2xl font-bold text-[var(--color-text-high)] mt-1">{doneProjects}</p>
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
                  <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{t('projects.atRisk')}</p>
                  <p className="text-2xl font-bold text-[var(--color-status-danger)] mt-1">{atRiskProjects}</p>
                </div>
                <div className="h-9 w-10 rounded-lg bg-[var(--color-status-danger)]/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-[var(--color-status-danger)]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('projects.searchProjects')} className="pl-9 h-9" />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[var(--color-bg-secondary)] rounded-lg p-1 border border-[var(--color-border-subtle)] h-9">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-7 px-2", view === 'grid' && "bg-[var(--color-bg-elevated)] text-[var(--color-text-high)] shadow-sm")}
                  onClick={() => setView('grid')}
                  title="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-7 px-2", view === 'list' && "bg-[var(--color-bg-elevated)] text-[var(--color-text-high)] shadow-sm")}
                  onClick={() => setView('list')}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'planning', 'active', 'on-track', 'at-risk'] as const).map((status) => (
              <Button
                key={status}
                variant={projectFilterStatus === status ? 'default' : 'outline'}
                size="sm"
                className={cn("h-8 capitalize transition-all", projectFilterStatus === status && "ring-2 ring-[var(--color-accent-primary)] shadow-md")}
                onClick={() => setProjectFilterStatus(status)}
              >
              {status === 'all' ? t('common.all') : status === 'on-track' ? t('projects.onTrack') : status === 'at-risk' ? t('projects.atRisk') : status === 'planning' ? t('projects.planning') : t('projects.active')}
              </Button>
            ))}
          </div>
        </div>

        <Modal open={showNewProject} onClose={() => setShowNewProject(false)} title={t('projects.newProject')} maxWidth="max-w-md">
          <form onSubmit={handleAddProject} className="space-y-4">
            <Input label={t('projects.projectName')} placeholder={t('projects.projectNamePlaceholder')} value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} required />
            <Input label={t('projects.projectDescription')} placeholder={t('projects.projectDescriptionPlaceholder')} value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} />
            <div>
              <label className="text-sm font-medium text-[var(--color-text-main)] block mb-1.5">{t('projects.projectDueDate')}</label>
              <Input type="date" value={newProjectDue} onChange={(e) => setNewProjectDue(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-main)] block mb-1.5">{t('projects.projectStatus')}</label>
              <select
                value={newProjectStatus}
                onChange={(e) => setNewProjectStatus(e.target.value as ProjectStatus)}
                className="w-full h-9 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)] focus:ring-2 focus:ring-[var(--color-accent-primary)]"
              >
                <option value="planning">{t('projects.planning')}</option>
                <option value="active">{t('projects.active')}</option>
                <option value="on-track">{t('projects.onTrack')}</option>
                <option value="at-risk">{t('projects.atRisk')}</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">{t('projects.createProject')}</Button>
              <Button type="button" variant="outline" onClick={() => setShowNewProject(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>

        <SidePanel open={!!selectedProject} onClose={() => { setSelectedProjectId(null); setEditingField(null); }} title={t('projects.projectDetails')}>
          {selectedProject && (
            <div className="flex flex-col gap-2.5">
              {/* Project Name */}
              {/* Project Name */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                  <FolderKanban className="h-3 w-3" />
                  <span>{t('projects.projectName').toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => setEditingField(editingField === 'name' ? null : 'name')}
                    className="ml-auto p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-high)] transition-colors"
                    title="Edit project name"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
                {editingField === 'name' ? (
                  <Input
                    type="text"
                    value={selectedProject.name}
                    onChange={(e) => handleUpdateProject(selectedProject.id, { name: e.target.value })}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className="text-base font-semibold border-2 border-[var(--color-accent-primary)] bg-[var(--color-bg-elevated)] px-2.5 py-1.5"
                  />
                ) : (
                  <div className="text-base font-semibold text-[var(--color-text-high)] bg-[var(--color-bg-elevated)] px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-[var(--color-bg-hover)]" onClick={() => setEditingField('name')}>
                    {selectedProject.name}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                  <FileText className="h-3 w-3" />
                  <span>{t('projects.projectDescription').toUpperCase()}</span>
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
                    value={selectedProject.description}
                    onChange={(e) => handleUpdateProject(selectedProject.id, { description: e.target.value })}
                    onBlur={() => setEditingField(null)}
                    placeholder="Add description..."
                    rows={5}
                    autoFocus
                    className="bg-[var(--color-bg-elevated)] border-2 border-[var(--color-accent-primary)] text-sm"
                  />
                ) : (
                  <div className="text-sm text-[var(--color-text-main)] bg-[var(--color-bg-elevated)] px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-[var(--color-bg-hover)] min-h-[100px]" onClick={() => setEditingField('description')}>
                    {selectedProject.description || <span className="text-[var(--color-text-muted)] italic">{t('common.noDescription')}</span>}
                  </div>
                )}
              </div>

              {/* Status with Dropdown */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{t('projects.projectStatus').toUpperCase()}</span>
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
                  <div className="flex gap-2">
                    <select
                      value={selectedProject.status}
                      onChange={(e) => { handleUpdateProject(selectedProject.id, { status: e.target.value as ProjectStatus }); setEditingField(null); }}
                      autoFocus
                      className="flex-1 h-9 rounded-lg border-2 border-[var(--color-accent-primary)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)]"
                    >
                      <option value="planning">{t('projects.planning')}</option>
                      <option value="active">{t('projects.active')}</option>
                      <option value="on-track">{t('projects.onTrack')}</option>
                      <option value="at-risk">{t('projects.atRisk')}</option>
                    </select>
                    <Button
                      onClick={() => setEditingField(null)}
                      className="px-4 h-9 text-sm"
                    >
                      {t('common.save')}
                    </Button>
                  </div>
                ) : (
                  <div onClick={() => setEditingField('status')} className="cursor-pointer hover:opacity-80">
                    {getStatusBadge(selectedProject.status)}
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                  <Clock className="h-3 w-3" />
                  <span>{t('projects.projectDueDate').toUpperCase()}</span>
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
                    defaultValue={selectedProject.dueDate && selectedProject.dueDate !== 'No date' ? new Date(selectedProject.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const formatted = e.target.value ? new Date(e.target.value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date';
                      handleUpdateProject(selectedProject.id, { dueDate: formatted });
                    }}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className="border-2 border-[var(--color-accent-primary)] bg-[var(--color-bg-elevated)] px-2.5 py-1.5 text-sm"
                  />
                ) : (
                  <div className="bg-[var(--color-bg-elevated)] px-2.5 py-1.5 rounded-lg text-sm text-[var(--color-text-high)] cursor-pointer hover:bg-[var(--color-bg-hover)]" onClick={() => setEditingField('dueDate')}>
                    {selectedProject.dueDate}
                  </div>
                )}
              </div>

              {/* Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                    <BarChart3 className="h-3 w-3" />
                  <span>{t('projects.progress').toUpperCase()} ({t('projects.fromTasks')})</span>
                  </div>
                  <span className="text-base font-semibold text-[var(--color-text-high)]">{selectedDerived?.progress ?? selectedProject.progress}%</span>
                </div>
                <Progress value={selectedDerived?.progress ?? selectedProject.progress} className="h-2" />
                <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                  <span>{t('projects.tasksDone')}: {selectedDerived?.completed ?? 0} / {selectedDerived?.total ?? 0}</span>
                  <span>{(selectedDerived?.total ?? 0) > 0 ? t('projects.linkedToProject') : t('projects.noLinkedTasksYet')}</span>
                </div>
              </div>

              {/* Related Tasks */}
              <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                    <Tag className="h-3 w-3" />
                  <span>{t('projects.linkedTasks').toUpperCase()}</span>
                    <span className="text-xs">{selectedLinked.length} items</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => { navigate(`/tasks?project=${encodeURIComponent(selectedProject.name)}`); setSelectedProjectId(null); }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    {t('projects.addTaskToProject')}
                  </Button>
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{t('projects.linkedTasksDesc')}</p>
                {selectedLinked.length === 0 ? (
                  <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-3 py-3 text-sm text-[var(--color-text-muted)]">
                      {t('projects.noLinkedTasksError')}
                    </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {selectedLinked.map((linkedTask) => (
                      <div key={linkedTask.id} className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-[var(--color-text-high)] truncate text-sm">{linkedTask.title}</p>
                          <Badge variant={linkedTask.status === 'done' ? 'success' : linkedTask.status === 'in-progress' ? 'warning' : 'info'} className="shrink-0 text-[10px]">
                          {linkedTask.status === 'done' ? t('tasks.done') : linkedTask.status === 'in-progress' ? t('tasks.inProgress') : t('tasks.todo')}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-[var(--color-text-muted)] mt-1 truncate">
                          {linkedTask.dueDate || t('common.noDate')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Project ID */}
              <div className="pt-2 border-t border-[var(--color-border-subtle)]">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  <Paperclip className="h-3 w-3" />
                  <span>{t('projects.projectId').toUpperCase()}</span>
                </div>
                <div className="text-base font-semibold text-[var(--color-text-high)] mt-1">
                  #{selectedProject.id}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDeleteConfirmId(selectedProject.id);
                    setSelectedProjectId(null);
                  }}
                  className="text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger)]/10 h-9 w-10"
                  title="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setSelectedProjectId(null)}
                  className="flex-1 h-9 text-sm"
                >
                  {t('common.save')}
                </Button>
              </div>
            </div>
          )}
        </SidePanel>

        <Modal open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title={t('projects.deleteProject')} maxWidth="max-w-sm">
          <p className="text-sm text-[var(--color-text-muted)] mb-4">{t('projects.deleteProjectConfirm')}</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={() => deleteConfirmId && handleDeleteProject(deleteConfirmId)}>{t('common.delete')}</Button>
          </div>
        </Modal>

        {view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
            {visibleProjects.map((project) => {
              const derived = getDerivedProgress(project);
              return (
                <Card key={project.id} className="group flex flex-col cursor-pointer" onClick={() => setSelectedProjectId(project.id)}>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className={cn('h-9 w-10 rounded-xl flex items-center justify-center text-white shadow-sm', project.color)}>
                        <FolderKanban className="h-5 w-5" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity hover:text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger)]/10"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirmId(project.id); }}
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-lg group-hover:text-[var(--color-accent-primary)] transition-colors">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1 h-9">{project.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col justify-end gap-4">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(project.status)}
                      <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-medium">
                        <Calendar className="h-3 w-3" />
                        {project.dueDate}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm items-center gap-2">
                        <span className="text-[var(--color-text-muted)] font-medium">{t('projects.progress')}</span>
                        <span className="text-[var(--color-text-high)] font-semibold">{derived.progress}%</span>
                      </div>
                      <Progress
                        value={derived.progress}
                        className="h-2"
                        indicatorClassName={
                          project.status === 'at-risk' ? 'bg-[var(--color-status-danger)]' :
                          project.status === 'on-track' ? 'bg-[var(--color-status-success)]' :
                          'bg-[var(--color-accent-primary)]'
                        }
                      />
                      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                        <span className="inline-flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 opacity-70" />
                          {derived.completed}/{derived.total} {t('projects.tasksDone')}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3 w-3 opacity-70" />
                          {t('common.due')} {project.dueDate}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="grid grid-cols-12 gap-4 px-6 py-3.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide border-b-2 border-[var(--color-border-strong)] sticky top-0 bg-[var(--color-bg-primary)] z-10">
              <div className="col-span-5">{t('projects.title')}</div>
              <div className="col-span-2 hidden sm:block text-center">{t('projects.projectStatus')}</div>
              <div className="col-span-2 hidden md:block">{t('common.dueDate')}</div>
              <div className="col-span-2">{t('projects.progress')}</div>
              <div className="col-span-1 text-center"> </div>
            </div>
            <div className="px-3 py-3">
              <div className="space-y-1">
                {visibleProjects.map((project) => {
                  const derived = getDerivedProgress(project);
                  return (
                    <div
                      key={project.id}
                      onClick={() => setSelectedProjectId(project.id)}
                      className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-strong)] hover:shadow-sm transition-all duration-200 group cursor-pointer"
                    >
                      <div className="col-span-5 flex items-center gap-3 min-w-0">
                        <div className={cn('h-9 w-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0', project.color)}>
                          <FolderKanban className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-[var(--color-text-high)] truncate">{project.name}</div>
                          <div className="text-xs text-[var(--color-text-muted)] truncate mt-1">{project.description}</div>
                        </div>
                      </div>

                      <div className="col-span-2 hidden sm:flex justify-center">{getStatusBadge(project.status)}</div>
                      <div className="col-span-2 hidden md:flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        <Calendar className="h-3 w-3 opacity-60" />
                        <span className="truncate font-medium">{project.dueDate}</span>
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[var(--color-text-muted)]">{derived.completed}/{derived.total}</span>
                          <span className="text-[var(--color-text-high)] font-semibold">{derived.progress}%</span>
                        </div>
                        <Progress value={derived.progress} className="h-2" />
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity hover:text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger)]/10"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirmId(project.id); }}
                          title="Delete project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
