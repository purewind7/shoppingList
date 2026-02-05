import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/app/components/ui/dialog';
import { ItemForm } from './ItemForm';
import { Plus, Trash2, ShoppingBasket, Pencil } from 'lucide-react';

// Define types locally since they aren't global yet
interface Ingredient {
  id: string;
  name: string;
  supermarket: string;
}

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, ingredients: Ingredient[], notes: string) => void;
  supermarkets: string[];
  onManageStores?: () => void;
  initialName?: string;
  initialIngredients?: Ingredient[];
  initialNotes?: string;
  submitLabel?: string;
  title?: string;
}

export const AddRecipeModal: React.FC<AddRecipeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  supermarkets,
  onManageStores,
  initialName = '',
  initialIngredients = [],
  initialNotes = '',
  submitLabel = 'Save Recipe',
  title = 'Create New Recipe',
}) => {
  const [recipeName, setRecipeName] = useState(initialName);
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [notes, setNotes] = useState(initialNotes);
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setRecipeName(initialName);
    setIngredients(initialIngredients);
    setNotes(initialNotes);
    setIsAddingIngredient(false);
    setEditingIngredient(null);
  }, [isOpen, initialName, initialIngredients, initialNotes]);

  const handleAddIngredient = (name: string, supermarket: string) => {
    if (editingIngredient) {
      setIngredients((prev) =>
        prev.map((ingredient) =>
          ingredient.id === editingIngredient.id
            ? { ...ingredient, name, supermarket }
            : ingredient
        )
      );
      setEditingIngredient(null);
      setIsAddingIngredient(false);
      return;
    }

    const newIngredient: Ingredient = {
      id: crypto.randomUUID(),
      name,
      supermarket,
    };
    setIngredients([...ingredients, newIngredient]);
    setIsAddingIngredient(false);
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(i => i.id !== id));
    if (editingIngredient?.id === id) {
      setEditingIngredient(null);
      setIsAddingIngredient(false);
    }
  };

  const handleSave = () => {
    if (!recipeName.trim()) return;
    onSave(recipeName, ingredients, notes);
    setRecipeName('');
    setIngredients([]);
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Add a name and ingredients to create a new recipe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Recipe Name Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Recipe Name</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Grandma's Lasagna"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              placeholder="Add instructions, quantities, or any notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
          </div>

          {/* Ingredients List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">Ingredients ({ingredients.length})</label>
            </div>
            
            {ingredients.length === 0 && !isAddingIngredient ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <ShoppingBasket className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No ingredients added yet</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {ingredients.map((ingredient) => (
                  <div key={ingredient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                    <div>
                      <p className="font-medium text-gray-800">{ingredient.name}</p>
                      {ingredient.supermarket && (
                        <p className="text-xs text-gray-500 mt-0.5">{ingredient.supermarket}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        onClick={() => {
                          setEditingIngredient(ingredient);
                          setIsAddingIngredient(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        aria-label="Edit ingredient"
                        title="Edit ingredient"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeIngredient(ingredient.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        aria-label="Delete ingredient"
                        title="Delete ingredient"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Ingredient Section */}
            {isAddingIngredient ? (
              <div className="mt-4">
                <ItemForm
                  supermarkets={supermarkets}
                  onSubmit={handleAddIngredient}
                  onCancel={() => {
                    setIsAddingIngredient(false);
                    setEditingIngredient(null);
                  }}
                  submitLabel={editingIngredient ? 'Update Ingredient' : 'Add Ingredient'}
                  autoFocus={true}
                  onManageStores={onManageStores}
                  initialName={editingIngredient?.name ?? ''}
                  initialSupermarkets={
                    editingIngredient?.supermarket
                      ? editingIngredient.supermarket.split(',').map((s) => s.trim()).filter(Boolean)
                      : []
                  }
                />
              </div>
            ) : (
              <button
                onClick={() => setIsAddingIngredient(true)}
                className="w-full py-3 mt-2 border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Ingredient
              </button>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!recipeName.trim()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors"
          >
            {submitLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
