import React, { useState } from 'react';
import { Store, Plus, X } from 'lucide-react';

interface ItemFormProps {
  supermarkets: string[];
  onSubmit: (name: string, supermarket: string) => void;
  onCancel: () => void;
  submitLabel?: string;
  autoFocus?: boolean;
}

export const ItemForm: React.FC<ItemFormProps> = ({ 
  supermarkets, 
  onSubmit, 
  onCancel,
  submitLabel = "Add to List",
  autoFocus = true
}) => {
  const [name, setName] = useState('');
  const [supermarketInput, setSupermarketInput] = useState('');
  const [selectedSupermarkets, setSelectedSupermarkets] = useState<string[]>([]);

  const handleAddSupermarket = () => {
    const trimmed = supermarketInput.trim();
    if (trimmed) {
      if (!selectedSupermarkets.includes(trimmed)) {
        setSelectedSupermarkets([...selectedSupermarkets, trimmed]);
      }
      setSupermarketInput('');
    }
  };

  const handleRemoveSupermarket = (tag: string) => {
    setSelectedSupermarkets(selectedSupermarkets.filter(s => s !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSupermarket();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Combine tags and current input value if it exists
    const finalSupermarkets = [...selectedSupermarkets];
    if (supermarketInput.trim() && !finalSupermarkets.includes(supermarketInput.trim())) {
      finalSupermarkets.push(supermarketInput.trim());
    }

    const supermarketString = finalSupermarkets.length > 0 
      ? finalSupermarkets.join(', ') 
      : 'General';

    onSubmit(name.trim(), supermarketString);
    setName('');
    setSupermarketInput('');
    setSelectedSupermarkets([]);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">What do you need?</label>
          <input
            autoFocus={autoFocus}
            type="text"
            placeholder="e.g. Oat Milk, Apples..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Supermarkets</label>
          
          {/* Tags Display */}
          {selectedSupermarkets.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedSupermarkets.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-100">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveSupermarket(tag)}
                    className="p-0.5 hover:bg-blue-100 rounded-md transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                list="supermarket-suggestions"
                type="text"
                placeholder="e.g. Trader Joe's"
                value={supermarketInput}
                onChange={(e) => setSupermarketInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSupermarket();
                  }
                }}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <datalist id="supermarket-suggestions">
                {supermarkets.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <button
              type="button"
              onClick={handleAddSupermarket}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
          >
            {submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};
