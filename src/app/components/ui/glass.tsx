import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './utils';

export const glassSurfaceVariants = cva('glass-surface', {
  variants: {
    shape: {
      icon: 'glass-shape-icon',
      pill: 'glass-shape-pill',
      bar: 'glass-shape-bar',
      panel: 'glass-shape-panel',
    },
    tone: {
      light: 'glass-tone-light',
      hero: 'glass-tone-hero',
    },
    depth: {
      medium: 'glass-depth-medium',
    },
    interactive: {
      true: 'glass-interactive',
      false: '',
    },
  },
  defaultVariants: {
    tone: 'light',
    depth: 'medium',
    interactive: false,
  },
});

export type GlassShape = NonNullable<VariantProps<typeof glassSurfaceVariants>['shape']>;
export type GlassTone = NonNullable<VariantProps<typeof glassSurfaceVariants>['tone']>;
export type GlassDepth = NonNullable<VariantProps<typeof glassSurfaceVariants>['depth']>;

interface SharedGlassProps {
  shape: GlassShape;
  tone?: GlassTone;
  depth?: GlassDepth;
  interactive?: boolean;
  className?: string;
}

export interface GlassSurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    SharedGlassProps {}

export function GlassSurface({
  className,
  shape,
  tone,
  depth,
  interactive = false,
  ...props
}: GlassSurfaceProps) {
  return (
    <div
      data-slot="glass-surface"
      data-glass-depth={depth ?? 'medium'}
      data-glass-shape={shape}
      data-glass-tone={tone ?? 'light'}
      className={cn(glassSurfaceVariants({ shape, tone, depth, interactive }), className)}
      {...props}
    />
  );
}

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    SharedGlassProps {}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      children,
      className,
      shape,
      tone,
      depth,
      interactive = true,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        data-slot="glass-button"
        data-glass-depth={depth ?? 'medium'}
        data-glass-shape={shape}
        data-glass-tone={tone ?? 'light'}
        className={cn(
          glassSurfaceVariants({ shape, tone, depth, interactive }),
          'inline-flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60',
          className
        )}
        {...props}
      >
        <span className="relative z-[1] inline-flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';

export interface GlassActionButtonProps
  extends Omit<GlassButtonProps, 'shape' | 'tone'> {
  accent?: 'blue' | 'orange';
}

export function GlassActionButton({
  accent = 'blue',
  className,
  children,
  ...props
}: GlassActionButtonProps) {
  return (
    <GlassButton
      shape="panel"
      tone="light"
      className={cn(
        'glass-action-surface w-full px-5 py-4 text-white font-bold shadow-none',
        accent === 'orange' ? 'glass-action-orange' : 'glass-action-blue',
        className
      )}
      {...props}
    >
      {children}
    </GlassButton>
  );
}

export interface GlassTabButtonProps
  extends Omit<GlassButtonProps, 'shape' | 'tone'> {
  active?: boolean;
  accent?: 'blue' | 'orange';
}

export function GlassTabButton({
  active = false,
  accent = 'blue',
  className,
  children,
  ...props
}: GlassTabButtonProps) {
  return (
    <GlassButton
      shape="panel"
      tone="light"
      aria-pressed={active}
      className={cn(
        'glass-tab-surface flex-1 py-2.5 text-xs sm:text-sm font-bold',
        active
          ? ['glass-tab-active', accent === 'orange' ? 'glass-tab-orange' : 'glass-tab-blue']
          : 'glass-tab-inactive',
        className
      )}
      {...props}
    >
      {children}
    </GlassButton>
  );
}
