import React from 'react';
import { LogOut } from 'lucide-react';
import { GlassButton } from '@/app/components/ui/glass';

interface LogoutButtonProps {
  onClick: () => void;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ onClick }) => {
  return (
    <GlassButton
      onClick={onClick}
      className="absolute top-6 right-6 z-20 size-11"
      shape="icon"
      tone="hero"
      aria-label="Sign out"
      title="Sign out"
    >
      <LogOut className="w-5 h-5" />
    </GlassButton>
  );
};
