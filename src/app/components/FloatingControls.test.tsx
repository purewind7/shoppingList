import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClearDoneButton } from './ClearDoneButton';
import { FooterStatsBar } from './FooterStatsBar';
import { MainMenu } from './MainMenu';
import { RefreshButton } from './RefreshButton';
import { ScrollToTopButton } from './ScrollToTopButton';

describe('Floating glass controls', () => {
  it('renders RefreshButton with shared glass classes and loading spin state', () => {
    const { container } = render(<RefreshButton isLoading onClick={jest.fn()} />);

    const button = screen.getByRole('button', { name: 'Refresh data' });
    const icon = container.querySelector('svg');

    expect(button).toHaveClass('glass-surface', 'glass-shape-icon', 'glass-tone-hero', 'glass-interactive');
    expect(icon).not.toBeNull();
    expect(icon as SVGElement).toHaveClass('animate-spin');
  });

  it('renders MainMenu with a hero glass trigger and menu actions', async () => {
    const user = userEvent.setup();
    const onManageStores = jest.fn();
    const onLogout = jest.fn();

    render(
      <MainMenu
        onManageStores={onManageStores}
        onLogout={onLogout}
        userEmail="groceries@example.com"
      />
    );

    const trigger = screen.getByRole('button', { name: 'Open main menu' });

    expect(trigger).toHaveClass(
      'glass-surface',
      'glass-shape-icon',
      'glass-tone-hero',
      'glass-interactive'
    );

    await user.click(trigger);

    expect(screen.getByText('groceries@example.com')).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: 'Manage stores' }));
    expect(onManageStores).toHaveBeenCalledTimes(1);

    await user.click(trigger);
    await user.click(screen.getByRole('menuitem', { name: 'Log out' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('hides ClearDoneButton when not visible and uses the pill glass variant when shown', () => {
    const { rerender } = render(<ClearDoneButton isVisible={false} onClick={jest.fn()} />);

    expect(screen.queryByRole('button', { name: 'Clear Done' })).not.toBeInTheDocument();

    rerender(<ClearDoneButton isVisible onClick={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Clear Done' })).toHaveClass(
      'glass-surface',
      'glass-shape-pill',
      'glass-tone-hero'
    );
  });

  it('hides FooterStatsBar when there is no total count and uses the bar glass variant when shown', () => {
    const { rerender } = render(<FooterStatsBar totalCount={0} completedCount={0} />);

    expect(screen.queryByText(/Total/)).not.toBeInTheDocument();

    rerender(<FooterStatsBar totalCount={8} completedCount={3} />);

    const surface = screen.getByText('8 Total').closest('[data-slot="glass-surface"]');

    expect(surface).not.toBeNull();
    expect(surface as HTMLElement).toHaveClass('glass-surface', 'glass-shape-bar', 'glass-tone-light');
    expect(screen.getByText('3 Completed')).toBeInTheDocument();
  });

  it('hides ScrollToTopButton when not visible and keeps the shared bottom spacing when shown', () => {
    const { rerender } = render(<ScrollToTopButton isVisible={false} onClick={jest.fn()} />);

    expect(screen.queryByRole('button', { name: 'Scroll to top' })).not.toBeInTheDocument();

    rerender(<ScrollToTopButton isVisible onClick={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Scroll to top' })).toHaveClass(
      'glass-surface',
      'glass-shape-icon',
      'bottom-6'
    );
  });
});
