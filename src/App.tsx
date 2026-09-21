import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';

const GamesHubPage = lazy(() =>
  import('./pages/GamesHubPage').then((m) => ({ default: m.GamesHubPage })),
);
const HistoryPage = lazy(() =>
  import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })),
);
const RedeemPage = lazy(() =>
  import('./pages/RedeemPage').then((m) => ({ default: m.RedeemPage })),
);
const RedeemHistoryPage = lazy(() =>
  import('./pages/RedeemHistoryPage').then((m) => ({ default: m.RedeemHistoryPage })),
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })),
);
const SpinPage = lazy(() =>
  import('./pages/SpinPage').then((m) => ({ default: m.SpinPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);
const WormzyPage = lazy(() =>
  import('./pages/games/WormzyPage').then((m) => ({ default: m.WormzyPage })),
);
const AquaFillPage = lazy(() =>
  import('./pages/games/AquaFillPage').then((m) => ({ default: m.AquaFillPage })),
);

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="boot-screen">Loading…</div>}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/games" replace />} />
              <Route path="/games" element={<GamesHubPage />} />
              <Route path="/games/wormzy" element={<WormzyPage />} />
              <Route path="/games/aqua-fill" element={<AquaFillPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/redeem" element={<RedeemPage />} />
              <Route path="/redeem/history" element={<RedeemHistoryPage />} />
              <Route path="/spin" element={<SpinPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
}
