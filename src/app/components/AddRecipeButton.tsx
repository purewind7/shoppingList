import React from 'react';
import { Plus } from 'lucide-react';

interface AddRecipeButtonProps {
  onClick: () => void;
}

export const AddRecipeButton: React.FC<AddRecipeButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-200 transition-all active:scale-[0.98]"
    >
      <Plus className="w-5 h-5" />
      Add New Recipe
    </button>
  );
};
