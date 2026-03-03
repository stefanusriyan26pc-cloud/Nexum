import React, { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Pencil } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO, startOfYear, differenceInCalendarDays } from 'date-fns';
import { cn } from '@/components/ui/Button';
import { useProjectNames } from '@/contexts/ProjectsContext';
import { useApiData } from '@/contexts/ApiDataContext';

type CalEvent = {
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

type StoredTask = {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  project: string;
  dueDate: string;
  dueDateISO?: string;
  startDate?: string;
  description?: string;
};

export default function Calendar() {
  const { projectNames } = useProjectNames();
  const { t } = useTranslation();
  const { tasks, events, addEvent, updateEvent, deleteEvent, updateTask, deleteTask } = useApiData();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [view, setView] = useState<'month' | 'week' | 'year'>('month');
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(format(today, 'yyyy-MM-dd'));
  const [newEventType, setNewEventType] = useState<CalEvent['type']>('meeting');
  const [newEventStartTime, setNewEventStartTime] = useState('09:00');
  const [newEventEndTime, setNewEventEndTime] = useState('10:00');
  const [newEventLocation, setNewEventLocation] = useState<CalEvent['location']>('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventRecurring, setNewEventRecurring] = useState<CalEvent['recurring']>('none');
  const [newEventTaskId, setNewEventTaskId] = useState('');
  const [newEventProjectId, setNewEventProjectId] = useState('');
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);
  const [selectedTask, setSelectedTask] = useState<StoredTask | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalEvent | null>(null);
  const [draggedTask, setDraggedTask] = useState<StoredTask | null>(null);
  const [editingTaskField, setEditingTaskField] = useState<string | null>(null);

  const openAddEventForDate = (date: Date) => {
    setNewEventDate(format(date, 'yyyy-MM-dd'));
    setShowNewEvent(true);
  };

  const resetEventForm = () => {
    setNewEventTitle('');
    setNewEventDate(format(currentDate, 'yyyy-MM-dd'));
    setNewEventType('meeting');
    setNewEventStartTime('09:00');
    setNewEventEndTime('10:00');
    setNewEventLocation('');
    setNewEventDescription('');
    setNewEventRecurring('none');
    setNewEventTaskId('');
    setNewEventProjectId('');
  };

  const handleAddEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    await addEvent({
      title: newEventTitle.trim(),
      date: newEventDate,
      type: newEventType,
      startTime: newEventStartTime,
      endTime: newEventEndTime,
      location: newEventLocation || undefined,
      description: newEventDescription.trim() || undefined,
      recurring: newEventRecurring || 'none',
    });
    resetEventForm();
    setShowNewEvent(false);
  };

  const handleEditEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editingEvent.title.trim()) return;
    const prevDate = events.find((ev) => ev.id === editingEvent.id)?.date;
    await updateEvent(editingEvent.id, editingEvent);
    setEditingEvent(null);
    if (editingEvent.date && prevDate !== editingEvent.date) {
      setCurrentDate(parseISO(editingEvent.date));
      setView('month');
    }
  };

  const handleDeleteEvent = async () => {
    if (editingEvent) {
      await deleteEvent(editingEvent.id);
      setEditingEvent(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, event: CalEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragStartTask = (e: React.DragEvent, task: StoredTask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const newDate = format(targetDate, 'yyyy-MM-dd');

    if (draggedEvent) {
      await updateEvent(draggedEvent.id, { date: newDate });
      setDraggedEvent(null);
    } else if (draggedTask) {
      const formattedLabel = targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      await updateTask(draggedTask.id, { dueDate: formattedLabel, dueDateISO: newDate });
      setDraggedTask(null);
    }
  };

  const handleDeleteTask = async () => {
    if (selectedTask) {
      await deleteTask(selectedTask.id);
      setSelectedTask(null);
    }
  };

  const handleUpdateTaskField = async (field: string, value: string) => {
    if (!selectedTask) return;
    const updates: Record<string, unknown> = { [field]: value };
    if (field === 'dueDateISO') {
      updates.dueDateISO = value;
      updates.dueDate = value ? new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : selectedTask.dueDate;
    }
    await updateTask(selectedTask.id, updates as Partial<{ dueDate: string; dueDateISO?: string; title?: string; description?: string }>);
    setSelectedTask({ ...selectedTask, ...updates });
    setEditingTaskField(null);
    if (field === 'dueDateISO' && value) {
      setCurrentDate(parseISO(value));
      setView('month');
    }
  };

  const isEventOnDate = (event: CalEvent, day: Date) => {
    const start = parseISO(event.date);
    if (differenceInCalendarDays(day, start) < 0) return false;
    if (event.recurring === 'daily') return true;
    if (event.recurring === 'weekly') return day.getDay() === start.getDay();
    if (event.recurring === 'monthly') return day.getDate() === start.getDate();
    return isSameDay(start, day);
  };

  const eventsForDate = (day: Date) => events.filter((e) => isEventOnDate(e, day));

  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find((task) => task.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const nextYear = () => setCurrentDate(addMonths(currentDate, 12));
  const prevYear = () => setCurrentDate(addMonths(currentDate, -12));

  const onNext = () => { if (view === 'year') nextYear(); else if (view === 'month') nextMonth(); else nextWeek(); };
  const onPrev = () => { if (view === 'year') prevYear(); else if (view === 'month') prevMonth(); else prevWeek(); };
  const onToday = () => setCurrentDate(new Date());

  const headerTitle = view === 'year' ? format(currentDate, 'yyyy') : view === 'month' ? format(currentDate, 'MMMM yyyy') : `Week of ${format(startOfWeek(currentDate), 'MMM d')}`;

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-display font-bold text-[var(--color-text-high)]">{headerTitle}</h2>
        <div className="flex items-center gap-1 bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)] p-1 border border-[var(--color-border-subtle)]">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPrev} aria-label={t('calendar.previous')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-medium" onClick={onToday}>{t('calendar.today')}</Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNext} aria-label={t('calendar.next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)] p-1 border border-[var(--color-border-subtle)]">
          <Button variant="ghost" size="sm" className={cn('h-7 px-3 text-xs', view === 'week' && 'bg-[var(--color-bg-elevated)] text-[var(--color-text-high)] shadow-sm')} onClick={() => setView('week')}>{t('calendar.weekView')}</Button>
          <Button variant="ghost" size="sm" className={cn('h-7 px-3 text-xs', view === 'month' && 'bg-[var(--color-bg-elevated)] text-[var(--color-text-high)] shadow-sm')} onClick={() => setView('month')}>{t('calendar.monthView')}</Button>
          <Button variant="ghost" size="sm" className={cn('h-7 px-3 text-xs', view === 'year' && 'bg-[var(--color-bg-elevated)] text-[var(--color-text-high)] shadow-sm')} onClick={() => setView('year')}>{t('calendar.yearView')}</Button>
        </div>
        <Button size="sm" className="h-9" onClick={() => openAddEventForDate(currentDate)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('calendar.newEvent')}
        </Button>
      </div>
    </div>
  );

  const renderDays = () => {
    const dateFormat = "EEEE";
    const days = [];
    let startDate = startOfWeek(currentDate);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center py-2 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider border-b border-[var(--color-border-subtle)]">
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = new Date(day.getTime());
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, today);
        const dayEvents = eventsForDate(cloneDay);
        const dayTasks = tasks.filter(
          (t) => t.dueDateISO && isSameDay(parseISO(t.dueDateISO), cloneDay)
        );

        days.push(
          <div
            key={day.toString()}
            className={cn(
              'min-h-[120px] p-2 border-b border-r border-[var(--color-border-subtle)] transition-colors hover:bg-[var(--color-bg-hover)] cursor-pointer relative group',
              !isCurrentMonth && 'bg-[var(--color-bg-secondary)]/50 text-[var(--color-text-disabled)]',
              isToday && 'bg-[var(--color-accent-primary)]/5',
              (draggedEvent || draggedTask) && 'hover:ring-2 hover:ring-[var(--color-accent-primary)] hover:ring-inset'
            )}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, cloneDay)}
          >
            <div className="flex justify-between items-start">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
                  isToday ? 'bg-[var(--color-accent-primary)] text-[var(--color-bg-primary)]' : 'text-[var(--color-text-main)]',
                  !isCurrentMonth && !isToday && 'text-[var(--color-text-disabled)]'
                )}
              >
                {formattedDate}
              </span>
              {(dayEvents.length + dayTasks.length) > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] border border-[var(--color-accent-primary)]/20">
                  {dayEvents.length + dayTasks.length}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-col gap-1 overflow-y-auto max-h-[80px] scrollbar-hide">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, event)}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'px-2 py-1 text-xs rounded-md font-medium border flex items-center gap-2 group/ev cursor-move hover:ring-1 hover:ring-[var(--color-accent-primary)] active:opacity-50',
                    event.type === 'meeting'
                      ? 'bg-[var(--color-status-info-bg)] text-[var(--color-status-info)] border-[var(--color-status-info)]/20'
                      : event.type === 'milestone'
                      ? 'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)] border-[var(--color-status-warning)]/20'
                      : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-high)] border-[var(--color-border-strong)]',
                    draggedEvent?.id === event.id && 'opacity-50'
                  )}
                  title={`${event.startTime}-${event.endTime} ${event.title}. Drag untuk pindah, klik untuk edit.`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingEvent(event);
                  }}
                >
                  <span className="flex-1 truncate">
                    <span className="opacity-70 mr-1">{event.startTime}</span>
                    <span className="truncate">{event.title.length > 20 ? event.title.substring(0, 17) + '...' : event.title}</span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEvent(event.id);
                    }}
                    className="p-0.5 hover:bg-red-500/20 rounded transition-colors shrink-0"
                  >
                    <Trash2 className="h-3 w-3 opacity-0 group-hover/ev:opacity-100 text-red-500" />
                  </button>
                </div>
              ))}
              {dayTasks.map((task) => (
                <div
                  key={`task-${task.id}`}
                  draggable
                  onDragStart={(e) => handleDragStartTask(e, task)}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'px-2 py-1 text-xs rounded-md truncate font-medium border flex items-center justify-between gap-1 cursor-move hover:ring-1 hover:ring-[var(--color-accent-primary)] bg-[var(--color-bg-elevated)] text-[var(--color-text-high)] border-[var(--color-border-strong)] active:opacity-50',
                    draggedTask?.id === task.id && 'opacity-50'
                  )}
                  title={`${task.title}${task.project ? ' · ' + task.project : ''}. Drag untuk pindah, klik untuk lihat detail.`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTask(task);
                  }}
                >
                  <span className="truncate">{task.title}</span>
                  {task.project && (
                    <span className="text-[10px] text-[var(--color-text-muted)] ml-1 truncate max-w-[80px]">
                      {task.project}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border-l border-t border-[var(--color-border-subtle)] rounded-lg overflow-hidden bg-[var(--color-bg-secondary)]">{rows}</div>;
  };

  const renderYearView = () => {
    const yearStart = startOfYear(currentDate);
    const months = Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {months.map((month) => {
          const monthEvents = events.filter((e) => {
            const first = startOfMonth(month);
            const last = endOfMonth(month);
            let cursor = first;
            while (cursor <= last) {
              if (isEventOnDate(e, cursor)) return true;
              cursor = addDays(cursor, 1);
            }
            return false;
          });
          return (
            <button
              key={month.getTime()}
              type="button"
              className="p-4 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] text-left transition-colors"
              onClick={() => { setCurrentDate(month); setView('month'); }}
            >
              <div className="font-medium text-[var(--color-text-high)]">{format(month, 'MMMM')}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">{monthEvents.length} {t('calendar.events')}</div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const dayEvents = eventsForDate(d);
          const dayTasks = tasks.filter(
            (task) => task.dueDateISO && isSameDay(parseISO(task.dueDateISO), d)
          );
          const isTodayDate = isSameDay(d, today);
          return (
            <div key={d.getTime()} className={cn('rounded-lg border border-[var(--color-border-subtle)] p-3 min-h-[200px]', isTodayDate && 'bg-[var(--color-accent-primary)]/5 border-[var(--color-accent-primary)]/30')}>
              <div className="flex justify-between items-center mb-2">
                <span className={cn('text-sm font-medium', isTodayDate && 'text-[var(--color-accent-primary)]')}>{format(d, 'EEE d')}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openAddEventForDate(d)} title={t('calendar.addEvent')}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      'px-2 py-1 text-xs rounded border truncate cursor-pointer hover:ring-1 hover:ring-[var(--color-accent-primary)]',
                      event.type === 'meeting'
                        ? 'bg-[var(--color-status-info-bg)] border-[var(--color-status-info)]/20'
                        : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-subtle)]'
                    )}
                    onClick={() => setEditingEvent(event)}
                  >
                    {event.startTime}-{event.endTime} {event.title}
                  </div>
                ))}
                {dayTasks.map((task) => (
                  <div
                    key={`task-${task.id}`}
                    role="button"
                    tabIndex={0}
                    className="px-2 py-1 text-xs rounded border truncate cursor-pointer hover:ring-1 hover:ring-[var(--color-accent-primary)] bg-[var(--color-bg-elevated)] border-[var(--color-border-subtle)]"
                    onClick={() => setSelectedTask(task)}
                  >
                    {task.title}
                    {task.project && (
                      <span className="text-[10px] text-[var(--color-text-muted)] ml-1">
                        · {task.project}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="flex h-full gap-4 relative">
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {renderHeader()}
        <Card className="flex-1 border-[var(--color-border-subtle)] overflow-hidden flex flex-col">
          <CardContent className="p-0 flex-1 flex flex-col overflow-y-auto">
            {view === 'year' && renderYearView()}
            {view === 'week' && renderWeekView()}
            {view === 'month' && (
              <>
                {renderDays()}
                {renderCells()}
              </>
            )}
          </CardContent>
        </Card>
        </div>

        {/* Sidebar Form - Fixed di kanan */}
        {showNewEvent && (
          <div className="w-[380px] h-full flex flex-col bg-[var(--color-bg-elevated)] border-l border-[var(--color-border-subtle)] shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)]">
              <h3 className="text-lg font-semibold text-[var(--color-text-high)]">{t('calendar.addEvent')}</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowNewEvent(false)} className="h-8 w-8">
                <Plus className="h-4 w-4 rotate-45" />
              </Button>
            </div>
            <form onSubmit={handleAddEvent} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Input label={t('calendar.eventTitle')} placeholder={t('calendar.titlePlaceholder')} value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} required />
            <Input label={t('calendar.eventDate')} type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input label={t('calendar.eventStartTime')} type="time" value={newEventStartTime} onChange={(e) => setNewEventStartTime(e.target.value)} />
              <Input label={t('calendar.eventEndTime')} type="time" value={newEventEndTime} onChange={(e) => setNewEventEndTime(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-main)] block mb-1.5">{t('calendar.eventType')}</label>
              <select
                value={newEventType}
                onChange={(e) => setNewEventType(e.target.value as CalEvent['type'])}
                className="w-full h-10 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)]"
              >
                <option value="meeting">{t('calendar.typesMeeting')}</option>
                <option value="task">{t('calendar.typesTask')}</option>
                <option value="milestone">{t('calendar.typesMilestone')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-main)] block mb-1.5">{t('calendar.eventLocation')}</label>
              <select
                value={newEventLocation}
                onChange={(e) => setNewEventLocation((e.target.value || '') as CalEvent['location'])}
                className="w-full h-10 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)]"
              >
                <option value="">-</option>
                <option value="online">{t('calendar.locationOnline')}</option>
                <option value="offline">{t('calendar.locationOffline')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-main)] block mb-1.5">{t('calendar.eventRecurring')}</label>
              <select
                value={newEventRecurring}
                onChange={(e) => setNewEventRecurring(e.target.value as CalEvent['recurring'])}
                className="w-full h-10 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)]"
              >
                <option value="none">{t('calendar.recurringNone')}</option>
                <option value="daily">{t('calendar.recurringDaily')}</option>
                <option value="weekly">{t('calendar.recurringWeekly')}</option>
                <option value="monthly">{t('calendar.recurringMonthly')}</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium text-[var(--color-text-main)] block mb-1.5">{t('calendar.linkTask')}</label>
                <select
                  onChange={(e) => setNewEventTaskId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)]"
                >
                  <option value="">-</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>{task.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-main)] block mb-1.5">{t('calendar.linkProject')}</label>
                <select
                  onChange={(e) => setNewEventProjectId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)]"
                >
                  <option value="">-</option>
                  {projectNames.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <Input label={t('calendar.eventDescription')} value={newEventDescription} onChange={(e) => setNewEventDescription(e.target.value)} />
            </form>
            <div className="px-6 py-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] flex gap-2">
              <Button type="submit" form="add-event-form" className="flex-1" onClick={handleAddEvent}>{t('calendar.saveEvent')}</Button>
              <Button type="button" variant="outline" onClick={() => setShowNewEvent(false)}>{t('common.cancel')}</Button>
            </div>
          </div>
        )}

      <Modal open={!!selectedTask} onClose={() => setSelectedTask(null)} title="Task Details" maxWidth="max-w-md">
        {selectedTask && (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-[var(--color-text-muted)]">📋 TITLE</span>
                <button
                  onClick={() => setEditingTaskField('title')}
                  className="p-1 hover:bg-[var(--color-bg-secondary)] rounded transition-colors"
                >
                  <Pencil className="h-3 w-3 text-[var(--color-text-muted)]" />
                </button>
              </div>
              {editingTaskField === 'title' ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedTask.title}
                    onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      handleUpdateTaskField('title', selectedTask.title);
                      setEditingTaskField(null);
                    }}
                    className="px-3 py-2 text-xs bg-[var(--color-accent-primary)] text-white rounded hover:opacity-90"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p className="text-sm font-semibold text-[var(--color-text-high)]">{selectedTask.title}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-[var(--color-text-muted)]">✓ STATUS</span>
                <button
                  onClick={() => setEditingTaskField('status')}
                  className="p-1 hover:bg-[var(--color-bg-secondary)] rounded transition-colors"
                >
                  <Pencil className="h-3 w-3 text-[var(--color-text-muted)]" />
                </button>
              </div>
              {editingTaskField === 'status' ? (
                <div className="flex gap-2">
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handleUpdateTaskField('status', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]"
                  >
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  <button
                    onClick={() => setEditingTaskField(null)}
                    className="px-3 py-2 text-xs border border-[var(--color-border-strong)] rounded hover:bg-[var(--color-bg-secondary)]"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingTaskField('status')}
                  className="text-xs px-3 py-1.5 rounded-full font-medium cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: selectedTask.status === 'todo' ? 'rgb(219, 234, 254)' : 
                                    selectedTask.status === 'in-progress' ? 'rgb(254, 243, 199)' :
                                    'rgb(220, 252, 231)',
                    color: selectedTask.status === 'todo' ? 'rgb(30, 58, 138)' :
                           selectedTask.status === 'in-progress' ? 'rgb(120, 53, 15)' :
                           'rgb(22, 101, 52)'
                  }}
                >
                  {selectedTask.status.replace('-', ' ')}
                </button>
              )}
            </div>

            {/* Priority */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-[var(--color-text-muted)]">⚡ PRIORITY</span>
                <button
                  onClick={() => setEditingTaskField('priority')}
                  className="p-1 hover:bg-[var(--color-bg-secondary)] rounded transition-colors"
                >
                  <Pencil className="h-3 w-3 text-[var(--color-text-muted)]" />
                </button>
              </div>
              {editingTaskField === 'priority' ? (
                <div className="flex gap-2">
                  <select
                    value={selectedTask.priority}
                    onChange={(e) => handleUpdateTaskField('priority', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <button
                    onClick={() => setEditingTaskField(null)}
                    className="px-3 py-2 text-xs border border-[var(--color-border-strong)] rounded hover:bg-[var(--color-bg-secondary)]"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingTaskField('priority')}
                  className="text-xs px-3 py-1.5 rounded-full font-medium cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: selectedTask.priority === 'high' ? 'rgb(254, 226, 226)' :
                                    selectedTask.priority === 'medium' ? 'rgb(254, 243, 199)' :
                                    'rgb(229, 231, 235)',
                    color: selectedTask.priority === 'high' ? 'rgb(127, 29, 29)' :
                           selectedTask.priority === 'medium' ? 'rgb(120, 53, 15)' :
                           'rgb(31, 41, 55)'
                  }}
                >
                  {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)} Priority
                </button>
              )}
            </div>

            {/* Project */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-[var(--color-text-muted)]">🏷️ PROJECT</span>
                <button
                  onClick={() => setEditingTaskField('project')}
                  className="p-1 hover:bg-[var(--color-bg-secondary)] rounded transition-colors"
                >
                  <Pencil className="h-3 w-3 text-[var(--color-text-muted)]" />
                </button>
              </div>
              {editingTaskField === 'project' ? (
                <div className="flex gap-2">
                  <select
                    value={selectedTask.project}
                    onChange={(e) => handleUpdateTaskField('project', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]"
                  >
                    <option value="">Select a project</option>
                    {projectNames.map((proj) => (
                      <option key={proj.id} value={proj.name}>{proj.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setEditingTaskField(null)}
                    className="px-3 py-2 text-xs border border-[var(--color-border-strong)] rounded hover:bg-[var(--color-bg-secondary)]"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-main)] bg-[var(--color-bg-secondary)] px-3 py-2 rounded">{selectedTask.project || '—'}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-[var(--color-text-muted)]">📝 DESCRIPTION</span>
                <button
                  onClick={() => setEditingTaskField('description')}
                  className="p-1 hover:bg-[var(--color-bg-secondary)] rounded transition-colors"
                >
                  <Pencil className="h-3 w-3 text-[var(--color-text-muted)]" />
                </button>
              </div>
              {editingTaskField === 'description' ? (
                <div className="space-y-2">
                  <textarea
                    value={selectedTask.description || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                    placeholder="Add a description..."
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] text-sm resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleUpdateTaskField('description', selectedTask.description || '');
                        setEditingTaskField(null);
                      }}
                      className="px-3 py-1.5 text-xs bg-[var(--color-accent-primary)] text-white rounded hover:opacity-90"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTaskField(null)}
                      className="px-3 py-1.5 text-xs border border-[var(--color-border-strong)] rounded hover:bg-[var(--color-bg-secondary)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-main)] bg-[var(--color-bg-secondary)] px-3 py-2 rounded min-h-[40px]">
                  {selectedTask.description || '—'}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">📅 START DATE</span>
                  <button
                    onClick={() => setEditingTaskField('startDate')}
                    className="p-1 hover:bg-[var(--color-bg-secondary)] rounded transition-colors"
                  >
                    <Pencil className="h-3 w-3 text-[var(--color-text-muted)]" />
                  </button>
                </div>
                {editingTaskField === 'startDate' ? (
                  <div className="flex gap-1">
                    <input
                      type="date"
                      value={selectedTask.startDate || ''}
                      onChange={(e) => handleUpdateTaskField('startDate', e.target.value)}
                      className="flex-1 px-2 py-1.5 text-xs rounded border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]"
                    />
                    <button
                      onClick={() => setEditingTaskField(null)}
                      className="px-2 py-1.5 text-xs border border-[var(--color-border-strong)] rounded hover:bg-[var(--color-bg-secondary)]"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-main)] bg-[var(--color-bg-secondary)] px-3 py-2 rounded">{selectedTask.startDate || '—'}</p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">🎯 DUE DATE</span>
                  <button
                    onClick={() => setEditingTaskField('dueDate')}
                    className="p-1 hover:bg-[var(--color-bg-secondary)] rounded transition-colors"
                  >
                    <Pencil className="h-3 w-3 text-[var(--color-text-muted)]" />
                  </button>
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)] mb-1.5">Pindah deadline ke bulan lain: klik pensil lalu pilih tanggal. Kalender akan pindah ke bulan tersebut.</p>
                {editingTaskField === 'dueDate' ? (
                  <div className="flex gap-1">
                    <input
                      type="date"
                      value={selectedTask.dueDateISO || ''}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value);
                        const formattedLabel = newDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        handleUpdateTaskField('dueDateISO', e.target.value);
                        handleUpdateTaskField('dueDate', formattedLabel);
                      }}
                      className="flex-1 px-2 py-1.5 text-xs rounded border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]"
                    />
                    <button
                      onClick={() => setEditingTaskField(null)}
                      className="px-2 py-1.5 text-xs border border-[var(--color-border-strong)] rounded hover:bg-[var(--color-bg-secondary)]"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-main)] bg-[var(--color-bg-secondary)] px-3 py-2 rounded">{selectedTask.dueDate || '—'}</p>
                )}
              </div>
            </div>

            {/* Task ID */}
            <div>
              <span className="text-xs font-medium text-[var(--color-text-muted)]">🔖 TASK ID</span>
              <p className="text-sm text-[var(--color-text-main)]">#{selectedTask.id}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
              <button
                onClick={handleDeleteTask}
                className="p-2 hover:bg-[var(--color-status-error)]/10 rounded transition-colors text-[var(--color-status-error)]"
                title="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSelectedTask(null)}
                className="flex-1 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
        <Modal open={!!editingEvent} onClose={() => setEditingEvent(null)} title="Edit Event" maxWidth="max-w-sm">
          {editingEvent && (
            <form onSubmit={handleEditEvent} className="space-y-3">
              <Input label="Event Title" value={editingEvent.title} onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })} required />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input label="Date" type="date" value={editingEvent.date} onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })} />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Pindah ke bulan lain? Pilih tanggal baru di atas, lalu Simpan. Kalender akan pindah ke bulan tersebut.</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-main)] block mb-1.5">Type</label>
                  <select
                    value={editingEvent.type}
                    onChange={(e) => setEditingEvent({ ...editingEvent, type: e.target.value as CalEvent['type'] })}
                    className="w-full h-10 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)]"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="task">Task</option>
                    <option value="milestone">Milestone</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Start Time" type="time" value={editingEvent.startTime} onChange={(e) => setEditingEvent({ ...editingEvent, startTime: e.target.value })} />
                <Input label="End Time" type="time" value={editingEvent.endTime} onChange={(e) => setEditingEvent({ ...editingEvent, endTime: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-main)] block mb-1.5">Location</label>
                  <select
                    value={editingEvent.location || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, location: (e.target.value || '') as CalEvent['location'] })}
                    className="w-full h-10 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)]"
                  >
                    <option value="">-</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-main)] block mb-1.5">Recurring</label>
                  <select
                    value={editingEvent.recurring || 'none'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, recurring: e.target.value as CalEvent['recurring'] })}
                    className="w-full h-10 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)]"
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-main)] block mb-1.5">Link Task</label>
                  <select
                    value={editingEvent.linkedTaskId || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, linkedTaskId: e.target.value || undefined })}
                    className="w-full h-10 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)]"
                  >
                    <option value="">-</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-main)] block mb-1.5">Link Project</label>
                  <select
                    value={editingEvent.linkedProjectId || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, linkedProjectId: e.target.value || undefined })}
                    className="w-full h-10 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-high)]"
                  >
                    <option value="">-</option>
                    {projectNames.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Input label="Description (optional)" value={editingEvent.description || ''} onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })} />

              <div className="flex gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
                <button
                  onClick={handleDeleteEvent}
                  className="p-2 hover:bg-[var(--color-status-error)]/10 rounded transition-colors text-[var(--color-status-error)]"
                  title="Delete event"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <Button type="submit" className="flex-1">Save</Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
}
