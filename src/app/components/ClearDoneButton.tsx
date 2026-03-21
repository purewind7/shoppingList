import React from 'react';
import { GlassButton } from '@/app/components/ui/glass';

interface ClearDoneButtonProps {
  isVisible: boolean;
  onClick: () => void;
}

export const ClearDoneButton: React.FC<ClearDoneButtonProps> = ({ isVisible, onClick }) => {
  if (!isVisible) return null;

  return (
    <GlassButton
      onClick={onClick}
      className="px-4 py-2 text-sm font-bold text-white"
      shape="pill"
      tone="hero"
    >
      Clear Done
    </GlassButton>
  );
};
