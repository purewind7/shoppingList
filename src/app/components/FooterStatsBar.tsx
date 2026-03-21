import React from 'react';
import { GlassSurface } from '@/app/components/ui/glass';

interface FooterStatsBarProps {
  totalCount: number;
  completedCount: number;
}

export const FooterStatsBar: React.FC<FooterStatsBarProps> = ({ totalCount, completedCount }) => {
  if (totalCount === 0) return null;

  return (
    <GlassSurface
      shape="bar"
      tone="light"
      className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 px-6 py-[11px] text-white [--glass-fill-start:rgb(15_23_42_/_0.58)] [--glass-fill-end:rgb(30_41_59_/_0.4)] [--glass-fill-fallback:rgb(15_23_42_/_0.74)] [--glass-border:rgb(255_255_255_/_0.12)] [--glass-highlight:rgb(255_255_255_/_0.18)] [--glass-sheen:rgb(255_255_255_/_0.12)] [--glass-shadow:rgb(15_23_42_/_0.2)] [--glass-shadow-strong:rgb(15_23_42_/_0.28)]"
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-400" />
        <span className="text-sm font-bold text-nowrap">{totalCount} Total</span>
      </div>
      <div className="w-px h-4 bg-white/18" />
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400" />
        <span className="text-sm font-bold text-nowrap">{completedCount} Completed</span>
      </div>
    </GlassSurface>
  );
};
