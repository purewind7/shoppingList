import React, { useEffect, useMemo, useState } from 'react';
import { Store } from 'lucide-react';

interface ItemFormProps {
  supermarkets: string[];
  onSubmit: (name: string, supermarket: string) => void;
  onCancel: () => void;
  submitLabel?: string;
  autoFocus?: boolean;
  onManageStores?: () => void;
  initialName?: string;
  initialSupermarkets?: string[];
}

export const ItemForm: React.FC<ItemFormProps> = ({ 
  supermarkets, 
  onSubmit, 
  onCancel,
  submitLabel = "Add to List",
  autoFocus = true,
  onManageStores,
  initialName,
  initialSupermarkets
}) => {
  const resolvedInitialStores = useMemo(
    () => initialSupermarkets ?? [],
    [initialSupermarkets]
  );
  const [name, setName] = useState(initialName ?? '');
  const [selectedSupermarkets, setSelectedSupermarkets] = useState<string[]>(resolvedInitialStores);

  useEffect(() => {
    setName(initialName ?? '');
    setSelectedSupermarkets(resolvedInitialStores);
  }, [initialName, resolvedInitialStores]);

  const toggleSupermarket = (store: string) => {
    setSelectedSupermarkets((prev) =>
      prev.includes(store) ? prev.filter((s) => s !== store) : [...prev, store]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const supermarketString =
      selectedSupermarkets.length > 0 ? selectedSupermarkets.join(', ') : 'General';

    onSubmit(name.trim(), supermarketString);
    setName('');
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
          <div className="flex items-center justify-between gap-3 mb-2">
            <label className="block text-sm font-semibold text-gray-700">Supermarkets</label>
            {onManageStores && (
              <button
                type="button"
                onClick={onManageStores}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Manage stores
              </button>
            )}
          </div>

          {supermarkets.length === 0 ? (
            <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4">
              No stores available yet. Add a store to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {supermarkets.map((store) => (
                <label
                  key={store}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedSupermarkets.includes(store)}
                    onChange={() => toggleSupermarket(store)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{store}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
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
