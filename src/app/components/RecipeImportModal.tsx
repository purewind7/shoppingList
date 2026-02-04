import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/app/components/ui/dialog';
import { ShoppingBag, Check } from 'lucide-react';

interface Ingredient {
  id: string;
  name: string;
  supermarket: string;
}

interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
}

interface RecipeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  onImport: (ingredients: Ingredient[]) => void;
}

export const RecipeImportModal: React.FC<RecipeImportModalProps> = ({
  isOpen,
  onClose,
  recipes,
  onImport,
}) => {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const handleImport = () => {
    const recipe = recipes.find(r => r.id === selectedRecipeId);
    if (recipe) {
      onImport(recipe.ingredients);
      onClose();
      setSelectedRecipeId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from Recipe</DialogTitle>
          <DialogDescription className="sr-only">
            Select a recipe to import its ingredients to your shopping list.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {recipes.length === 0 ? (
             <div className="text-center py-8 text-gray-500">
                No recipes available. Create one in the "Recipe" tab first.
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto">
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedRecipeId(recipe.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                    selectedRecipeId === recipe.id
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                       selectedRecipeId === recipe.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`font-bold ${selectedRecipeId === recipe.id ? 'text-blue-900' : 'text-gray-800'}`}>
                        {recipe.name}
                      </p>
                      <p className="text-xs text-gray-500">{recipe.ingredients.length} ingredients</p>
                    </div>
                  </div>
                  {selectedRecipeId === recipe.id && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedRecipeId}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors"
          >
            Import Items
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
