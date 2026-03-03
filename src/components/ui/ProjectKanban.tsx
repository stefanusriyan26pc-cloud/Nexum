import { useMemo, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Calendar, CheckCircle2, Clock, FolderKanban } from 'lucide-react';
import { cn } from '@/components/ui/Button';

type ProjectStatus = 'planning' | 'active' | 'on-track' | 'at-risk';
type ProjectItem = any; // Will be properly typed from parent

const COLUMNS: { id: ProjectStatus; title: string }[] = [
  { id: 'planning', title: 'Planning' },
  { id: 'active', title: 'Active' },
  { id: 'on-track', title: 'On Track' },
  { id: 'at-risk', title: 'At Risk' },
];

function SortableProjectCard({ project, onClick, getDerivedProgress }: { project: ProjectItem; onClick: () => void; getDerivedProgress: (p: any) => any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id, data: { type: 'Project', project } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const derived = getDerivedProgress(project);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing pb-3">
      <Card className={cn("group flex flex-col pointer-events-auto", isDragging ? 'shadow-lg border-[var(--color-accent-primary)]' : '')} onClick={(e) => {
        // Prevent clicking when dragging
        if (e.defaultPrevented) return;
        onClick();
      }}>
        <CardHeader className="pb-3 p-4">
          <div className="flex justify-between items-start mb-2">
            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-sm', project.color || 'bg-blue-500')}>
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <CardTitle className="text-base group-hover:text-[var(--color-accent-primary)] transition-colors">{project.name}</CardTitle>
          <CardDescription className="line-clamp-2 mt-1 h-8 text-xs">{project.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-end gap-3 p-4 pt-0">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] font-medium">
            <Calendar className="h-3 w-3" />
            {project.dueDate}
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs items-center gap-2">
              <span className="text-[var(--color-text-high)] font-semibold">{derived.progress}%</span>
            </div>
            <Progress 
              value={derived.progress} 
              className="h-1.5" 
              indicatorClassName={
                project.status === 'at-risk' ? 'bg-[var(--color-status-danger)]' :
                project.status === 'on-track' ? 'bg-[var(--color-status-success)]' :
                'bg-[var(--color-accent-primary)]'
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProjectKanban({ projects, onStatusChange, onProjectClick, getDerivedProgress }: { projects: ProjectItem[]; onStatusChange: (id: string, status: ProjectStatus) => void; onProjectClick: (id: string) => void; getDerivedProgress: (p: any) => any }) {
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before dragging starts, allows clicking
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const project = projects.find(p => p.id === active.id);
    if (project) setActiveProject(project);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveProject(null);
    const { active, over } = event;
    if (!over) return;

    const projectId = active.id as string;
    const overId = over.id as string;

    // Check if over is a column
    const isColumn = COLUMNS.some(c => c.id === overId);
    if (isColumn) {
      onStatusChange(projectId, overId as ProjectStatus);
      return;
    }

    // Check if over is another project
    const overProject = projects.find(p => p.id === overId);
    if (overProject) {
      onStatusChange(projectId, overProject.status);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto h-full pb-4 items-start">
        {COLUMNS.map(column => {
          const columnProjects = projects.filter(p => p.status === column.id);
          return (
            <div key={column.id} className="flex flex-col bg-[var(--color-bg-secondary)]/50 border border-[var(--color-border-subtle)] rounded-xl w-80 shrink-0 max-h-full">
              <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                <h3 className="font-semibold text-sm text-[var(--color-text-high)] flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full", 
                    column.id === 'planning' ? 'bg-purple-500' :
                    column.id === 'active' ? 'bg-blue-500' :
                    column.id === 'on-track' ? 'bg-emerald-500' : 'bg-rose-500'
                  )} />
                  {column.title}
                </h3>
                <Badge variant="outline" className="text-xs bg-[var(--color-bg-elevated)]">{columnProjects.length}</Badge>
              </div>
              <div className="p-3 overflow-y-auto flex-1 min-h-[150px]">
                <SortableContext id={column.id} items={columnProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  {columnProjects.map(project => (
                    <SortableProjectCard key={project.id} project={project} onClick={() => onProjectClick(project.id)} getDerivedProgress={getDerivedProgress} />
                  ))}
                  {columnProjects.length === 0 && (
                    <div className="border-2 border-dashed border-[var(--color-border-subtle)] rounded-lg h-24 flex items-center justify-center text-xs text-[var(--color-text-muted)]">
                      Drop projects here
                    </div>
                  )}
                </SortableContext>
              </div>
            </div>
          );
        })}
      </div>
      
      <DragOverlay>
        {activeProject ? (
          <div className="opacity-90 scale-105 pointer-events-none rotate-2">
            <Card className="w-80 shadow-2xl border-[var(--color-accent-primary)]">
              <CardHeader className="pb-3 p-4">
                <CardTitle className="text-base">{activeProject.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1 h-8 text-xs">{activeProject.description}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
