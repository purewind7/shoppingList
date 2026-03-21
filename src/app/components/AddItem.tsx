import React, { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { ItemForm } from './ItemForm';

interface AddItemProps {
  onAdd: (name: string, supermarket: string) => void;
  supermarkets: string[];
  onManageStores?: () => void;
  itemNameSuggestions?: Array<{ name: string; supermarket: string }>;
  buttonWrapperClassName?: string;
}

export const AddItem: React.FC<AddItemProps> = ({
  onAdd,
  supermarkets,
  onManageStores,
  itemNameSuggestions,
  buttonWrapperClassName,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const formContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdding) return;
    if (!window.matchMedia('(max-width: 768px)').matches) return;

    const timer = window.setTimeout(() => {
      const top = (formContainerRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 12;
      window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    }, 60);

    return () => window.clearTimeout(timer);
  }, [isAdding]);

  const handleAdd = (name: string, supermarket: string) => {
    onAdd(name, supermarket);
    setIsAdding(false);
  };

  return (
    <div className={!isAdding ? buttonWrapperClassName : undefined}>
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Add New Item
        </button>
      ) : (
        <div ref={formContainerRef}>
          <ItemForm
            supermarkets={supermarkets}
            onSubmit={handleAdd}
            onCancel={() => setIsAdding(false)}
            onManageStores={onManageStores}
            itemNameSuggestions={itemNameSuggestions}
          />
        </div>
      )}
    </div>
  );
};
