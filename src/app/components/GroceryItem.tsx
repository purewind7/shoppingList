import React from 'react';
import { Check, Trash2, Store, Pencil } from 'lucide-react';
import { motion } from 'motion/react';

interface GroceryItemProps {
  item: {
    id: string;
    name: string;
    supermarket: string;
    completed: boolean;
  };
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  highlightColor?: string;
}

export const GroceryItem: React.FC<GroceryItemProps> = ({ item, onToggle, onEdit, onDelete, highlightColor }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative overflow-hidden flex items-center justify-between p-4 mb-3 rounded-xl border transition-all ${
        item.completed 
          ? 'bg-gray-50/50 border-gray-100 opacity-60' 
          : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100'
      }`}
    >
      {highlightColor && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-1.5" 
          style={{ backgroundColor: highlightColor }} 
        />
      )}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={() => onToggle(item.id)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            item.completed 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-300 hover:border-blue-500'
          }`}
        >
          {item.completed && <Check className="w-4 h-4" />}
        </button>
        
        <div className="flex flex-col">
          <span className={`text-lg transition-all ${item.completed ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>
            {item.name}
          </span>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <Store className="w-3.5 h-3.5 text-gray-400" />
            {item.supermarket.split(',').map((s, idx) => (
              <span key={idx} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider border border-blue-100/50">
                {s.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
        <button
          onClick={() => onEdit(item.id)}
          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          aria-label="Edit item"
          title="Edit item"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          aria-label="Delete item"
          title="Delete item"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};
