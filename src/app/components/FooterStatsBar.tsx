import React from 'react';

interface FooterStatsBarProps {
  totalCount: number;
  completedCount: number;
}

export const FooterStatsBar: React.FC<FooterStatsBarProps> = ({ totalCount, completedCount }) => {
  if (totalCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-900 text-white rounded-full shadow-2xl flex items-center gap-3 z-40">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-400" />
        <span className="text-sm font-bold text-nowrap">{totalCount} Total</span>
      </div>
      <div className="w-px h-4 bg-gray-700" />
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400" />
        <span className="text-sm font-bold text-nowrap">{completedCount} Completed</span>
      </div>
    </div>
  );
};
