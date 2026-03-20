import React from 'react';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  onClick: () => void;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="absolute top-6 right-6 z-20 p-3 rounded-full bg-white/70 backdrop-blur-md text-gray-500 hover:text-red-600 transition-colors"
      aria-label="Sign out"
      title="Sign out"
    >
      <LogOut className="w-5 h-5" />
    </button>
  );
};
