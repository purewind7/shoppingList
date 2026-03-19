import React from 'react';
import { ChevronUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  isVisible: boolean;
  onClick: () => void;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ isVisible, onClick }) => {
  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 sm:hidden z-40 p-3 rounded-full bg-white/90 backdrop-blur-md text-gray-700 shadow-lg border border-white/60 hover:bg-white transition-colors"
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
};
