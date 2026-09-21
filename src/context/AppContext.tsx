import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ensureSeeded } from '../db/seed';
import { getWallet, subscribeWallet } from '../services/walletService';
import type { Wallet } from '../types/models';

interface AppStore {
  ready: boolean;
  wallet: Wallet | null;
}

const AppContext = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: () => void = () => undefined;

    void (async () => {
      await ensureSeeded();
      if (cancelled) return;

      unsubscribe = subscribeWallet((next) => {
        if (!cancelled) setWallet(next);
      });
      const current = await getWallet();
      if (!cancelled) {
        setWallet(current);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ ready, wallet }), [ready, wallet]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}

export function useWallet(): Wallet {
  const { wallet } = useAppStore();
  if (!wallet) {
    return {
      id: 'primary',
      tokens: 0,
      gameCoins: 0,
      ves: 0,
      sves: 0,
      gems: 0,
      spins: 0,
      updatedAt: 0,
    };
  }
  return wallet;
}
