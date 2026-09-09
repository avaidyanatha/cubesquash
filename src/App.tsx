import { Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar';
import CubePage from './pages/CubePage';
import HomePage from './pages/HomePage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/c/:id" element={<CubePage />} />
        </Routes>
      </main>
      <footer className="px-4 py-6 text-center text-xs text-text-secondary">
        Not affiliated with Cube Cobra. Nothing here changes your cube; it only reads the public changelog.
      </footer>
    </div>
  );
}
