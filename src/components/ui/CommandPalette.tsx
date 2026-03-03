import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { LayoutDashboard, CheckCircle2, FolderKanban, Calendar, BarChart2, Wallet, Settings, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from './Modal';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh] sm:pt-[25vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-xl shadow-2xl rounded-2xl overflow-hidden glass-panel border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]"
          >
            <Command
              className="flex w-full flex-col bg-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false);
              }}
            >
              <div className="flex items-center border-b border-[var(--color-border-subtle)] px-4">
                <Search className="mr-3 h-5 w-5 text-[var(--color-text-muted)] shrink-0" />
                <Command.Input
                  placeholder="Type a command or search..."
                  className="flex h-14 w-full bg-transparent text-base text-[var(--color-text-high)] placeholder:text-[var(--color-text-muted)] outline-none border-none"
                  autoFocus
                />
              </div>

              <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-smooth">
                <Command.Empty className="py-6 text-center text-sm text-[var(--color-text-muted)]">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/'))}
                    className="flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-[var(--color-text-main)] aria-selected:bg-[var(--color-accent-primary)]/10 aria-selected:text-[var(--color-accent-primary)] mt-1"
                  >
                    <LayoutDashboard className="mr-3 h-4 w-4" />
                    Dashboard
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/projects'))}
                    className="flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-[var(--color-text-main)] aria-selected:bg-[var(--color-accent-primary)]/10 aria-selected:text-[var(--color-accent-primary)]"
                  >
                    <FolderKanban className="mr-3 h-4 w-4" />
                    Projects
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/tasks'))}
                    className="flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-[var(--color-text-main)] aria-selected:bg-[var(--color-accent-primary)]/10 aria-selected:text-[var(--color-accent-primary)]"
                  >
                    <CheckCircle2 className="mr-3 h-4 w-4" />
                    Tasks
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/calendar'))}
                    className="flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-[var(--color-text-main)] aria-selected:bg-[var(--color-accent-primary)]/10 aria-selected:text-[var(--color-accent-primary)]"
                  >
                    <Calendar className="mr-3 h-4 w-4" />
                    Calendar
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/finance'))}
                    className="flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-[var(--color-text-main)] aria-selected:bg-[var(--color-accent-primary)]/10 aria-selected:text-[var(--color-accent-primary)]"
                  >
                    <Wallet className="mr-3 h-4 w-4" />
                    Finance
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/analytics'))}
                    className="flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-[var(--color-text-main)] aria-selected:bg-[var(--color-accent-primary)]/10 aria-selected:text-[var(--color-accent-primary)]"
                  >
                    <BarChart2 className="mr-3 h-4 w-4" />
                    Analytics
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Settings" className="px-2 pt-4 pb-1.5 text-xs font-medium text-[var(--color-text-muted)] mt-2 border-t border-[var(--color-border-subtle)]">
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/settings'))}
                    className="flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-[var(--color-text-main)] aria-selected:bg-[var(--color-accent-primary)]/10 aria-selected:text-[var(--color-accent-primary)] mt-1"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    General Settings
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
