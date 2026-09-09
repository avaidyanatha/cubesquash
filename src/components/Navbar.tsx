import { LinkExternalIcon, MoonIcon, SunIcon } from '@primer/octicons-react';
import { Link } from 'react-router-dom';

import { useTheme } from '../hooks/useTheme';

const NAV_ITEM =
  'flex items-center gap-1 rounded-md select-none cursor-pointer p-2 font-semibold text-text-secondary hover:text-text-secondary-active transition-colors duration-200 ease-in-out';

export default function Navbar() {
  const [theme, toggleTheme] = useTheme();
  return (
    <header className="px-4 sm:px-6 py-2 bg-bg-secondary">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img className="h-10 hidden sm:block" src="/banner.png" alt="Cube Cobra" />
          <img className="h-10 sm:hidden" src="/sticker.png" alt="Cube Cobra" />
          <span className="text-white font-semibold text-sm sm:text-base border-l border-white/20 pl-3">
            Changelog Squasher
          </span>
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
