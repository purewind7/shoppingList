import React from 'react';
import { ChevronUp } from 'lucide-react';
import { GlassButton } from '@/app/components/ui/glass';

interface ScrollToTopButtonProps {
  isVisible: boolean;
  onClick: () => void;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ isVisible, onClick }) => {
  if (!isVisible) return null;

  return (
    <GlassButton
      onClick={onClick}
      className="fixed right-6 z-40 size-11 sm:hidden [--glass-fill-start:rgb(255_255_255_/_0.42)] [--glass-fill-end:rgb(255_255_255_/_0.14)] [--glass-fill-fallback:rgb(255_255_255_/_0.72)] [--glass-border:rgb(255_255_255_/_0.34)] [--glass-highlight:rgb(255_255_255_/_0.56)] [--glass-sheen:rgb(255_255_255_/_0.34)] [--glass-shadow:rgb(148_163_184_/_0.12)] [--glass-shadow-strong:rgb(148_163_184_/_0.16)] bottom-6"
      shape="icon"
      tone="light"
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <ChevronUp className="w-5 h-5" />
    </GlassButton>
  );
};
