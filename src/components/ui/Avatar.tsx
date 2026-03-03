import { HTMLAttributes, forwardRef, useState, useEffect } from 'react';
import { cn } from './Button';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, fallback, size = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
    };
    const [imgError, setImgError] = useState(false);
    // Reset error when src changes so new images load fresh
    useEffect(() => { setImgError(false); }, [src]);
    const showImage = src && !imgError;

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex shrink-0 overflow-hidden rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)]',
          sizes[size],
          className
        )}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={fallback || 'Avatar'}
            className="aspect-square h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--color-bg-elevated)] text-[var(--color-text-high)] font-medium">
            {fallback || '?'}
          </div>
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';
