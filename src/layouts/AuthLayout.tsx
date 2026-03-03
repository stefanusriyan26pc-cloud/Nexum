import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { NexumLogoIcon } from '@/components/NexumLogo';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-stretch bg-[var(--color-bg-primary)]">
      <div className="w-full grid gap-0 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.1fr)]">
        {/* Left: Auth form */}
        <div className="relative px-5 py-6 sm:px-8 sm:py-8 md:px-10 md:py-10 flex flex-col">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-6 sm:mb-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-secondary)] transition-opacity hover:opacity-90"
            aria-label="Go to home"
          >
            <NexumLogoIcon size={32} />
            <span className="font-display text-base sm:text-lg font-semibold text-[var(--color-text-high)]">
              Nexum
            </span>
          </Link>

          <div className="flex-1 flex items-center">
            <div className="w-full max-w-md mx-auto">{children}</div>
          </div>

          <p className="mt-6 text-[11px] text-[var(--color-text-muted)] text-center md:text-left">
            By continuing, you agree to our{' '}
            <span className="underline underline-offset-2">Terms</span> and{' '}
            <span className="underline underline-offset-2">Privacy Policy</span>.
          </p>
        </div>

        {/* Right: Illustration / brand panel */}
        <div className="hidden md:flex relative overflow-hidden items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28)_0,transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.30)_0,transparent_60%)]" />

          <div className="relative z-10 px-10 py-10 text-white max-w-md">
            <p className="text-xs font-medium uppercase tracking-[0.22em] mb-3 text-sky-100/85">
              Personal Productivity OS
            </p>
            <h1 className="text-2xl leading-snug font-display font-semibold mb-4">
              Turn your day into a <br />
              focused flow state.
            </h1>
            <p className="text-sm text-sky-50/90 mb-6">
              Plan projects, tasks, calendar, and finance in one canvas. Nexum keeps everything in sync so
              you can move from idea to done without friction.
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-100 border border-emerald-300/60 text-[11px]">
                  ✓
                </span>
                <div>
                  <p className="font-medium">See today&apos;s focus instantly</p>
                  <p className="text-sky-50/85 text-xs">
                    Smart overview of deadlines and active projects every time you sign in.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-400/20 text-indigo-100 border border-indigo-200/70 text-[11px]">
                  ✓
                </span>
                <div>
                  <p className="font-medium">Built-in finance & analytics</p>
                  <p className="text-sky-50/85 text-xs">
                    Track income, expenses, and productivity trends without leaving your workspace.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-400/25 text-fuchsia-50 border border-fuchsia-200/80 text-[11px]">
                  ✓
                </span>
                <div>
                  <p className="font-medium">Secure & synced</p>
                  <p className="text-sky-50/85 text-xs">
                    Supabase-backed workspace that stays in sync across devices.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
