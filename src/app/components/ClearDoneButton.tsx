import React from 'react';

interface ClearDoneButtonProps {
  isVisible: boolean;
  onClick: () => void;
}

export const ClearDoneButton: React.FC<ClearDoneButtonProps> = ({ isVisible, onClick }) => {
  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full text-sm font-bold hover:bg-white/30 transition-all"
    >
      Clear Done
    </button>
  );
};
