import { cn } from '@/components/ui/Button';

/** Tech / futuristic Nexum logo – classic cyan/slate, geometric */
export function NexumLogo({
  showWordmark = true,
  className,
  iconClassName,
  size = 'md',
}: {
  showWordmark?: boolean;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const iconSizes = { sm: 28, md: 32, lg: 40 };
  const textSizes = { sm: 'text-base', md: 'text-lg', lg: 'text-xl' };
  const w = iconSizes[size];
  const h = iconSizes[size];

  return (
    <div className={cn('flex items-center gap-2.5 overflow-hidden', className)}>
      <NexumLogoIcon size={w} className={cn('shrink-0', iconClassName)} />
      {showWordmark && (
        <span className={cn('font-display font-semibold tracking-tight text-[var(--color-text-high)] truncate', textSizes[size])}>
          Nexum
        </span>
      )}
    </div>
  );
}

/** Icon: geometric N with tech cyan accent */
export function NexumLogoIcon({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="nexum-tech" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="6" fill="var(--color-bg-elevated)" stroke="url(#nexum-tech)" strokeWidth="1.5" />
      <path
        d="M9 8v16h2.5V15l5.5-7h2v7h2V8h-2v6l-5.5 7H11V8H9z"
        fill="url(#nexum-tech)"
        fillOpacity="0.95"
      />
      <circle cx="11" cy="11" r="1.2" fill="url(#nexum-tech)" />
      <circle cx="21" cy="21" r="1.2" fill="url(#nexum-tech)" />
    </svg>
  );
}
