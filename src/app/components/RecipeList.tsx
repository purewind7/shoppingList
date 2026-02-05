import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShoppingBag, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Ingredient {
  id: string;
  name: string;
  supermarket: string;
}

interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  notes?: string;
  createdAt: number;
}

interface RecipeListProps {
  recipes: Recipe[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export const RecipeList: React.FC<RecipeListProps> = ({ recipes, onDelete, onEdit }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (recipes.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-orange-500" />
        </div>
        <p className="text-gray-500 font-medium">No recipes created yet</p>
        <p className="text-gray-400 text-sm mt-1">Click "Add New Recipe" to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recipes.map((recipe) => (
        <div 
          key={recipe.id} 
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div 
            onClick={() => toggleExpand(recipe.id)}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-orange-600">
                  {recipe.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{recipe.name}</h3>
                <p className="text-sm text-gray-500">{recipe.ingredients.length} ingredients</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(recipe.id);
                }}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                aria-label="Edit recipe"
                title="Edit recipe"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(recipe.id);
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                aria-label="Delete recipe"
                title="Delete recipe"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {expandedId === recipe.id ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          <AnimatePresence>
            {expandedId === recipe.id && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 border-t border-gray-100 bg-gray-50/50">
                  <div className="space-y-2 mt-3">
                    {recipe.ingredients.map((ingredient) => (
                      <div key={ingredient.id} className="flex items-center gap-3 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-300" />
                        <span className="font-medium">{ingredient.name}</span>
                        {ingredient.supermarket && (
                          <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                            {ingredient.supermarket}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {recipe.notes && (
                    <div className="mt-4 p-3 rounded-xl bg-white border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{recipe.notes}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};
