import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/app/components/ui/dialog';
import { ItemForm } from './ItemForm';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, supermarket: string) => void;
  supermarkets: string[];
  initialName: string;
  initialSupermarkets: string[];
  onManageStores?: () => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  supermarkets,
  initialName,
  initialSupermarkets,
  onManageStores,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription className="sr-only">
            Update the item name and store tags.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ItemForm
            supermarkets={supermarkets}
            onSubmit={(name, supermarket) => {
              onSave(name, supermarket);
              onClose();
            }}
            onCancel={onClose}
            submitLabel="Save Changes"
            autoFocus={true}
            onManageStores={onManageStores}
            initialName={initialName}
            initialSupermarkets={initialSupermarkets}
          />
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
