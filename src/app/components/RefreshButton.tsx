import React from 'react';
import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  isLoading: boolean;
  onClick: () => void;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ isLoading, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="absolute left-6 z-20 p-3 rounded-full bg-white/70 backdrop-blur-md text-gray-500 hover:text-blue-600 transition-colors"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}
      aria-label="Refresh data"
      title="Refresh data"
    >
      <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
    </button>
  );
};
