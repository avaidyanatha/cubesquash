import { LinkExternalIcon, MoonIcon, SunIcon } from '@primer/octicons-react';
import { Link } from 'react-router-dom';

import { useTheme } from '../hooks/useTheme';
import Logo from './Logo';

const NAV_ITEM =
  'flex items-center gap-1 rounded-md select-none cursor-pointer p-2 font-semibold text-text-secondary hover:text-text-secondary-active transition-colors duration-200 ease-in-out';

export default function Navbar() {
  const [theme, toggleTheme] = useTheme();
  return (
    <header className="px-4 sm:px-6 py-2 bg-bg-secondary">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" className="shrink-0" title="Cube Squash">
          <Logo markSize={38} />
        </Link>
        <nav className="flex items-center gap-1">
          <a href="https://cubecobra.com" target="_blank" rel="noopener noreferrer" className={NAV_ITEM}>
            <span className="hidden sm:inline">Cube Cobra</span>
            <LinkExternalIcon size={16} />
          </a>
          <button type="button" onClick={toggleTheme} className={NAV_ITEM} title="Toggle dark mode">
            {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
          </button>
        </nav>
      </div>
    </header>
  );
}
