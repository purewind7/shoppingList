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
      className="absolute top-6 left-6 z-20 p-3 rounded-full bg-white/70 backdrop-blur-md text-gray-500 hover:text-blue-600 transition-colors"
      aria-label="Refresh data"
      title="Refresh data"
    >
      <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
    </button>
  );
};
