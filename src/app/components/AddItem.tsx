import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ItemForm } from './ItemForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

interface AddItemProps {
  onAdd: (name: string, supermarket: string) => void;
  supermarkets: string[];
  onManageStores?: () => void;
  itemNameSuggestions?: Array<{ name: string; supermarket: string }>;
  buttonWrapperClassName?: string;
  buttonWrapperStyle?: React.CSSProperties;
}

export const AddItem: React.FC<AddItemProps> = ({
  onAdd,
  supermarkets,
  onManageStores,
  itemNameSuggestions,
  buttonWrapperClassName,
  buttonWrapperStyle,
}) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (name: string, supermarket: string) => {
    onAdd(name, supermarket);
    setIsAdding(false);
  };

  return (
    <div
      className={!isAdding ? buttonWrapperClassName : undefined}
      style={!isAdding ? buttonWrapperStyle : undefined}
    >
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Add New Item
        </button>
      ) : null}

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add New Item</DialogTitle>
            <DialogDescription className="sr-only">
              Add an item name and choose the stores where you want to buy it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <ItemForm
              supermarkets={supermarkets}
              onSubmit={handleAdd}
              onCancel={() => setIsAdding(false)}
              onManageStores={onManageStores}
              itemNameSuggestions={itemNameSuggestions}
              variant="plain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
