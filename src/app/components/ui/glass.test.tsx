import { render, screen } from '@testing-library/react';
import { GlassActionButton, GlassTabButton, glassSurfaceVariants } from './glass';

describe('glassSurfaceVariants', () => {
  it('emits shape classes for icon, pill, bar, and panel variants', () => {
    expect(glassSurfaceVariants({ shape: 'icon' })).toContain('glass-shape-icon');
    expect(glassSurfaceVariants({ shape: 'pill' })).toContain('glass-shape-pill');
    expect(glassSurfaceVariants({ shape: 'bar' })).toContain('glass-shape-bar');
    expect(glassSurfaceVariants({ shape: 'panel' })).toContain('glass-shape-panel');
  });

  it('renders glass action buttons with the shared panel treatment', () => {
    render(<GlassActionButton accent="orange">Add New Recipe</GlassActionButton>);

    expect(screen.getByRole('button', { name: 'Add New Recipe' })).toHaveClass(
      'glass-surface',
      'glass-shape-panel',
      'glass-interactive',
      'glass-action-surface',
      'glass-action-orange'
    );
  });

  it('renders active glass tab buttons with the tab-specific treatment', () => {
    render(<GlassTabButton active accent="orange">Recipes</GlassTabButton>);

    expect(screen.getByRole('button', { name: 'Recipes' })).toHaveClass(
      'glass-surface',
      'glass-shape-panel',
      'glass-tab-surface',
      'glass-tab-active',
      'glass-tab-orange'
    );
  });
});
