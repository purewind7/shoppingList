import React from 'react';
import { LogOut, MoreHorizontal, Store } from 'lucide-react';
import { GlassButton } from '@/app/components/ui/glass';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';

interface MainMenuProps {
  onManageStores: () => void;
  onLogout: () => void;
  userEmail?: string;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onManageStores, onLogout, userEmail }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <GlassButton
          className="absolute right-6 z-20 size-11"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 2.5rem)' }}
          shape="icon"
          tone="hero"
          aria-label="Open main menu"
          title="Open main menu"
        >
          <MoreHorizontal className="h-5 w-5" />
        </GlassButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="glass-menu-content w-60 rounded-3xl !border-0 !bg-transparent !p-0 text-gray-700 !shadow-none"
      >
        <div className="glass-menu-panel">
          <DropdownMenuLabel className="glass-menu-label">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500/90">
              Shopping Notes
            </span>
            <span className="mt-1 block truncate text-sm font-semibold text-gray-700">
              {userEmail || 'Main menu'}
            </span>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="glass-menu-separator" />

          <DropdownMenuItem
            className="glass-menu-item data-[highlighted]:bg-white/40 data-[highlighted]:text-gray-900"
            onSelect={onManageStores}
          >
            <Store className="h-4 w-4" />
            Manage stores
          </DropdownMenuItem>

          <DropdownMenuItem
            className="glass-menu-item data-[highlighted]:bg-white/40 data-[highlighted]:text-gray-900"
            onSelect={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
