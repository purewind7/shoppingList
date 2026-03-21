import React from 'react';
import { RefreshCw } from 'lucide-react';
import { GlassButton } from '@/app/components/ui/glass';

interface RefreshButtonProps {
  isLoading: boolean;
  onClick: () => void;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ isLoading, onClick }) => {
  return (
    <GlassButton
      onClick={onClick}
      className="absolute left-6 z-20 size-11"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 2.5rem)' }}
      shape="icon"
      tone="hero"
      aria-label="Refresh data"
      aria-busy={isLoading}
      title="Refresh data"
    >
      <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
    </GlassButton>
  );
};
