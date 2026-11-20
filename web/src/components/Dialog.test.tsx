import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../theme/theme';
import { Dialog } from './Dialog';

function renderDialog(open: boolean, onExited: () => void) {
  return (
    <ThemeProvider theme={theme}>
      <button type="button">Open</button>
      <Dialog open={open} onClose={vi.fn()} onExited={onExited} title="Edit Asha Rao">
        Form
      </Dialog>
    </ThemeProvider>
  );
}

describe('Dialog closing', () => {
  it('stays on screen while the closing animation plays, then closes and returns focus', async () => {
    const onExited = vi.fn();
    const { rerender } = render(renderDialog(false, onExited));
    const opener = screen.getByRole('button', { name: 'Open' });
    opener.focus();
    rerender(renderDialog(true, onExited));
    const dialog = screen.getByRole('dialog', { name: 'Edit Asha Rao' });

    // jsdom has no animations: stand in for the browser's running closing animation.
    let endAnimation: (() => void) | undefined;
    const finished = new Promise<void>((resolve) => {
      endAnimation = resolve;
    });
    Object.assign(dialog, { getAnimations: () => [{ finished }] });

    rerender(renderDialog(false, onExited));

    // Animating out: still open, marked as closing, and the page is not told to remove it yet.
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAttribute('data-closing');
    expect(onExited).not.toHaveBeenCalled();

    endAnimation?.();

    await waitFor(() => expect(onExited).toHaveBeenCalledOnce());
    expect(dialog).not.toHaveAttribute('open');
    expect(dialog).not.toHaveAttribute('data-closing');
    expect(opener).toHaveFocus();
  });
});
