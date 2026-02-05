import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/app/components/ui/dialog';
import { Plus, Store, Trash2 } from 'lucide-react';

interface StoreManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: string[];
  defaultStores: string[];
  onAddStore: (name: string) => Promise<void>;
  onRemoveStore: (name: string) => Promise<void>;
}

export const StoreManagerModal: React.FC<StoreManagerModalProps> = ({
  isOpen,
  onClose,
  stores,
  defaultStores,
  onAddStore,
  onRemoveStore,
}) => {
  const [newStore, setNewStore] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultStoreSet = useMemo(() => new Set(defaultStores.map((s) => s.toLowerCase())), [defaultStores]);

  const handleAdd = async () => {
    const trimmed = newStore.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      await onAddStore(trimmed);
      setNewStore('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add store.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (store: string) => {
    setSaving(true);
    setError(null);
    try {
      await onRemoveStore(store);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove store.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Stores</DialogTitle>
          <DialogDescription className="sr-only">
            Add or remove stores used for tagging items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Add a store name"
                value={newStore}
                onChange={(e) => setNewStore(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-1 disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stores.length === 0 ? (
              <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4">
                No stores yet. Add one above to get started.
              </div>
            ) : (
              stores.map((store) => {
                const isDefault = defaultStoreSet.has(store.toLowerCase());
                return (
                  <div
                    key={store}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-800">{store}</span>
                      {isDefault && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(store)}
                      disabled={saving || isDefault}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                      aria-label={`Remove ${store}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
          >
            Done
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
