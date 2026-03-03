import { ReactNode, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, CheckCircle2, FolderKanban, Calendar as CalendarIcon, BarChart2, Wallet, Settings, Bell, Sun, Moon, X, LogOut, Search } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { NexumLogo, NexumLogoIcon } from '@/components/NexumLogo';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { cn } from '@/components/ui/Button';
import { useApiData } from '@/contexts/ApiDataContext';
import { makeInitialAvatar } from '@/lib/avatar';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { motion, AnimatePresence } from 'motion/react';

const NAV_PATHS = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/', section: 'core' },
  { icon: CheckCircle2,   labelKey: 'nav.tasks',     path: '/tasks',     section: 'work' },
  { icon: FolderKanban,  labelKey: 'nav.projects',  path: '/projects',  section: 'work' },
  { icon: CalendarIcon,  labelKey: 'nav.calendar',  path: '/calendar',  section: 'work' },
  { icon: Wallet,        labelKey: 'nav.finance',   path: '/finance',   section: 'analysis' },
  { icon: BarChart2,     labelKey: 'nav.reports',   path: '/analytics', section: 'analysis' },
];
const SETTINGS_PATH = { icon: Settings, labelKey: 'nav.settings', path: '/settings' };

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const { profile, tasks, projects, updateProfile } = useApiData();
  const mainNavItems = NAV_PATHS.map(item => ({ ...item, label: t(item.labelKey) }));
  const settingsNavItem = { ...SETTINGS_PATH, label: t(SETTINGS_PATH.labelKey) };
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; description: string; at: string }>>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const headerProfile = {
    username: profile.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    avatarSrc: profile.avatarSrc,
  };

  useEffect(() => {
    if (!profileOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) setNotificationsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

  useEffect(() => {
    const now = new Date();
    const items: Array<{ id: string; title: string; description: string; at: string }> = [];

    tasks.forEach((task) => {
      if (!task.dueDateISO) return;
      const due = new Date(task.dueDateISO);
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      if (
        due.getFullYear() === tomorrow.getFullYear() &&
        due.getMonth() === tomorrow.getMonth() &&
        due.getDate() === tomorrow.getDate()
      ) {
        items.push({
          id: `task-${task.id}`,
          title: t('layout.deadlineTomorrow'),
          description: t('layout.deadlineTomorrowDesc', { title: task.title }),
          at: now.toISOString(),
        });
      }
    });

    projects.forEach((project) => {
      if (project.status === 'at-risk') {
        items.push({
          id: `project-${project.id}`,
          title: t('layout.projectAtRisk'),
          description: t('layout.projectAtRiskDesc', { name: project.name }),
          at: now.toISOString(),
        });
      }
    });

    setNotifications(items);
  }, [tasks, projects, t]);

  useEffect(() => {
    if (notificationsOpen) {
      updateProfile({ notificationsSeenAt: new Date().toISOString() });
    }
  }, [notificationsOpen, updateProfile]);

  const seenAt = profile.notificationsSeenAt ?? '';
  const hasUnread = notifications.some((n) => !seenAt || new Date(n.at).getTime() > new Date(seenAt).getTime());

  return (
    <div className="flex h-screen w-full bg-[var(--color-bg-primary)] overflow-hidden">
      <CommandPalette />
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-subtle)] transition-all duration-300 ease-out lg:static lg:translate-x-0',
          isSidebarOpen ? 'w-56' : 'w-[72px]',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 px-2 border-b border-[var(--color-border-subtle)] min-h-[56px]">
          <button
            type="button"
            onClick={() => (window.innerWidth >= 1024 ? setIsSidebarOpen((o) => !o) : setIsMobileSidebarOpen(false))}
            className="flex items-center justify-center gap-2.5 min-w-0 flex-1 lg:flex-initial outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-secondary)] rounded-lg px-1"
            aria-label={isSidebarOpen ? t('layout.collapseSidebar') : t('layout.expandSidebar')}
          >
            {isSidebarOpen ? (
              <NexumLogo showWordmark size="md" className="min-w-0" />
            ) : (
              <NexumLogoIcon size={28} className="shrink-0" />
            )}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0 h-8 w-8"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label={t('layout.closeMenu')}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5 min-h-0">
          {/* Core Section */}
          <div className="flex flex-col gap-0.5">
            {mainNavItems
              .filter((item) => item.section === 'core')
              .map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] border border-[var(--color-accent-primary)]/20'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-main)]'
                    )}
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    <item.icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-[var(--color-accent-primary)]' : '')} />
                    {isSidebarOpen && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
          </div>

          {/* Work Section */}
          <div className="flex flex-col gap-0.5 mt-2 pt-2 border-t border-[var(--color-border-subtle)]">
            {isSidebarOpen && (
              <div className="px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider opacity-60">
                {t('nav.work')}
              </div>
            )}
            {mainNavItems
              .filter((item) => item.section === 'work')
              .map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] border border-[var(--color-accent-primary)]/20'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-main)]'
                    )}
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    <item.icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-[var(--color-accent-primary)]' : '')} />
                    {isSidebarOpen && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
          </div>

          {/* Analysis Section */}
          <div className="flex flex-col gap-0.5 mt-2 pt-2 border-t border-[var(--color-border-subtle)]">
            {isSidebarOpen && (
              <div className="px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider opacity-60">
                {t('nav.analysis')}
              </div>
            )}
            {mainNavItems
              .filter((item) => item.section === 'analysis')
              .map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] border border-[var(--color-accent-primary)]/20'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-main)]'
                    )}
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    <item.icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-[var(--color-accent-primary)]' : '')} />
                    {isSidebarOpen && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
          </div>

          {/* Settings - at bottom */}
          <div className="mt-auto pt-2 border-t border-[var(--color-border-subtle)]">
            <Link
              to={settingsNavItem.path}
              onClick={() => setIsMobileSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                location.pathname === settingsNavItem.path || location.pathname.startsWith(settingsNavItem.path)
                  ? 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] border border-[var(--color-accent-primary)]/20'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-main)]'
              )}
              title={!isSidebarOpen ? settingsNavItem.label : undefined}
            >
              <settingsNavItem.icon className={cn('h-5 w-5 shrink-0', location.pathname.startsWith(settingsNavItem.path) ? 'text-[var(--color-accent-primary)]' : '')} />
              {isSidebarOpen && <span className="truncate">{settingsNavItem.label}</span>}
            </Link>
          </div>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center justify-between gap-4 px-4 lg:px-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]/95 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center min-w-0">
            <button
              type="button"
              className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg hover:bg-[var(--color-bg-hover)] focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] mr-2"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label={t('layout.openMenu')}
            >
              <NexumLogoIcon size={28} />
            </button>
            
            {/* Search Trigger */}
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)] rounded-md transition-colors w-64"
            >
              <Search className="h-4 w-4" />
              <span>{t('layout.searchPlaceholder')}</span>
              <span className="ml-auto text-xs opacity-60 font-medium">⌘K</span>
            </button>
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="sm:hidden flex items-center justify-center h-9 w-9 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
              aria-label={t('layout.searchPlaceholder')}
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title={theme === 'light' ? t('layout.darkMode') : t('layout.lightMode')}
              aria-label={t('layout.darkMode')}
            >
              {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="relative" ref={notificationsRef}>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-lg"
                onClick={() => setNotificationsOpen((o) => !o)}
                title={t('layout.notifications')}
              >
                <Bell className="h-4 w-4" />
                {hasUnread && <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-status-danger)] ring-2 ring-[var(--color-bg-primary)]" />}
              </Button>
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-1 w-72 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] py-2 shadow-[var(--shadow-lg)] z-50">
                  <div className="px-3 py-2 border-b border-[var(--color-border-subtle)]">
                    <span className="font-medium text-sm text-[var(--color-text-high)]">{t('layout.notifications')}</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">{t('layout.noNotifications')}</div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto px-2 py-1">
                      {notifications.map((item) => (
                        <div key={item.id} className="rounded-md px-2 py-2 hover:bg-[var(--color-bg-hover)]">
                          <div className="text-sm font-medium text-[var(--color-text-high)]">{item.title}</div>
                          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="h-6 w-px bg-[var(--color-border-subtle)] hidden sm:block" />
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)]"
                aria-label={t('layout.profileMenu')}
              >
                <Avatar src={headerProfile.avatarSrc || makeInitialAvatar(headerProfile.firstName || 'N')} fallback={(headerProfile.firstName?.[0] ?? 'N').toUpperCase()} size="sm" className="h-8 w-8 ring-1 ring-[var(--color-border-subtle)]" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] py-1 shadow-[var(--shadow-lg)] z-50">
                  {(headerProfile.username || headerProfile.firstName || headerProfile.email) && (
                    <div className="px-3 py-2.5 border-b border-[var(--color-border-subtle)] mb-1">
                      <p className="text-xs font-semibold text-[var(--color-text-high)] truncate">
                        {headerProfile.username || `${headerProfile.firstName ?? ''} ${headerProfile.lastName ?? ''}`.trim() || headerProfile.email}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{headerProfile.email}</p>
                    </div>
                  )}
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] rounded-md mx-1"
                  >
                    <Settings className="h-4 w-4" />
                    {t('nav.settings')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); navigate('/login'); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] rounded-md mx-1"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('common.signOut')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[var(--color-bg-primary)]">
          <div className="mx-auto max-w-6xl h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
