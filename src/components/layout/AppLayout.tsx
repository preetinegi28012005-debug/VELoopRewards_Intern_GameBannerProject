import { Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '../../context/AppContext';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function AppLayout() {
  const { ready } = useAppStore();
  const location = useLocation();
  const gamePlay = location.pathname.startsWith('/games/') && location.pathname !== '/games';

  return (
    <div className={gamePlay ? 'app-shell app-shell--play' : 'app-shell'}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        {ready ? (
          <Outlet />
        ) : (
          <div className="boot-screen" role="status">
            Loading VELOOP Games…
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
