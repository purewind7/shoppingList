import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ItemForm } from './ItemForm';

interface AddItemProps {
  onAdd: (name: string, supermarket: string) => void;
  supermarkets: string[];
}

export const AddItem: React.FC<AddItemProps> = ({ onAdd, supermarkets }) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (name: string, supermarket: string) => {
    onAdd(name, supermarket);
    setIsAdding(false);
  };

  return (
    <div className="mb-8">
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Add New Item
        </button>
      ) : (
        <ItemForm
          supermarkets={supermarkets}
          onSubmit={handleAdd}
          onCancel={() => setIsAdding(false)}
        />
      )}
    </div>
  );
};
