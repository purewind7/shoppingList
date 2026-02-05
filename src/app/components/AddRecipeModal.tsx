import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/app/components/ui/dialog';
import { ItemForm } from './ItemForm';
import { Plus, Trash2, ShoppingBasket } from 'lucide-react';

// Define types locally since they aren't global yet
interface Ingredient {
  id: string;
  name: string;
  supermarket: string;
}

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, ingredients: Ingredient[]) => void;
  supermarkets: string[];
  onManageStores?: () => void;
}

export const AddRecipeModal: React.FC<AddRecipeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  supermarkets,
  onManageStores,
}) => {
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);

  const handleAddIngredient = (name: string, supermarket: string) => {
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
  };

  const handleSave = () => {
    if (!recipeName.trim()) return;
    onSave(recipeName, ingredients);
    setRecipeName('');
    setIngredients([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Recipe</DialogTitle>
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
                    <button
                      onClick={() => removeIngredient(ingredient.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                  onCancel={() => setIsAddingIngredient(false)}
                  submitLabel="Add Ingredient"
                  autoFocus={true}
                  onManageStores={onManageStores}
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
            Save Recipe
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
