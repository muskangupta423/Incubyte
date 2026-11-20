import { Button } from '../../components/Button';
import { MoonIcon, SunIcon } from '../../components/icons';
import { useColorMode } from '../../theme/color-mode';

export function ThemeToggle() {
  const { mode, toggleColorMode } = useColorMode();
  const label = mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <Button variant="ghost" onClick={toggleColorMode} aria-label={label} title={label}>
      {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
