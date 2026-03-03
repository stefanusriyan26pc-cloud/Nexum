import { useMemo, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar, Trash2 } from 'lucide-react';
import { cn } from '@/components/ui/Button';

type TaskStatus = 'todo' | 'in-progress' | 'done';
type TaskItem = any; // Will be properly typed from parent

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'bg-[var(--color-status-info)]' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-[var(--color-status-warning)]' },
  { id: 'done', title: 'Done', color: 'bg-[var(--color-status-success)]' },
];

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high': return 'danger';
    case 'medium': return 'warning';
    case 'low': return 'info';
    default: return 'default';
  }
}

function SortableTaskCard({ task, onClick, onDelete }: { task: TaskItem; onClick: () => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isOverdue = task.dueDateISO ? new Date(task.dueDateISO) < new Date() && task.status !== 'done' : false;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing pb-3">
      <Card
        onClick={(e) => {
          if (e.defaultPrevented) return;
          onClick();
        }}
        className={cn(
          'pointer-events-auto group hover:border-[var(--color-border-strong)] transition-all select-none bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-2xl shadow-sm flex flex-col',
          isDragging && 'shadow-lg border-[var(--color-accent-primary)]'
        )}
      >
        <CardContent className="p-4 flex flex-col gap-2.5">
          <div className="flex justify-between items-start gap-2">
            <Badge variant={getPriorityColor(task.priority) as any} className="text-[10px] font-medium px-2.5 py-1 rounded-md shadow-sm capitalize">
              {task.priority}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-1 -mt-1 text-[var(--color-text-muted)] hover:text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger)]/10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <p className={cn("font-medium text-sm leading-snug line-clamp-2", task.status === 'done' ? "text-[var(--color-text-muted)] line-through" : "text-[var(--color-text-high)]")}>
            {task.title}
          </p>

          <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-info)]" />
              <span className="truncate max-w-[150px]">{task.project || 'General'}</span>
            </span>
            {task.description && <span className="opacity-70">Notes</span>}
          </div>

          <div className="flex items-center justify-between mt-1 pt-1 border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span
                className={cn(
                  'truncate max-w-[120px]',
                  isOverdue && 'text-[var(--color-status-danger)] font-medium'
                )}
              >
                {task.dueDate}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function TaskKanban({ tasks, onStatusChange, onTaskClick, onDeleteTask }: { tasks: TaskItem[]; onStatusChange: (id: string, status: TaskStatus) => void; onTaskClick: (id: string) => void; onDeleteTask: (id: string) => void }) {
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const isColumn = COLUMNS.some(c => c.id === overId);
    if (isColumn) {
      onStatusChange(taskId, overId as TaskStatus);
      return;
    }

    const overTask = tasks.find(t => t.id === overId);
    if (overTask) {
      onStatusChange(taskId, overTask.status);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto h-full pb-4 items-start">
        {COLUMNS.map(column => {
          const columnTasks = tasks.filter(t => t.status === column.id);
          return (
            <div key={column.id} className="flex flex-col bg-[var(--color-bg-secondary)]/50 border border-[var(--color-border-subtle)] rounded-xl w-[320px] shrink-0 max-h-full">
              <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full", column.color.replace('bg-', 'bg-').split('/')[0])} />
                  <h3 className="font-semibold text-sm text-[var(--color-text-high)]">{column.title}</h3>
                </div>
                <Badge variant="outline" className="text-xs bg-[var(--color-bg-elevated)]">{columnTasks.length}</Badge>
              </div>
              <div className="p-3 overflow-y-auto flex-1 min-h-[150px]">
                <SortableContext id={column.id} items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {columnTasks.map(task => (
                    <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} onDelete={() => onDeleteTask(task.id)} />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="border-2 border-dashed border-[var(--color-border-subtle)] rounded-lg h-24 flex items-center justify-center text-xs text-[var(--color-text-muted)]">
                      Drop tasks here
                    </div>
                  )}
                </SortableContext>
              </div>
            </div>
          );
        })}
      </div>
      
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 scale-105 pointer-events-none rotate-2">
            <Card className="w-[320px] shadow-2xl border-[var(--color-accent-primary)] bg-[var(--color-bg-elevated)]">
              <CardContent className="p-4 flex flex-col gap-2.5">
                <Badge variant={getPriorityColor(activeTask.priority) as any} className="w-fit text-[10px] font-medium px-2.5 py-1 rounded-md shadow-sm capitalize">
                  {activeTask.priority}
                </Badge>
                <p className="font-medium text-sm text-[var(--color-text-high)] leading-snug line-clamp-2">
                  {activeTask.title}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
