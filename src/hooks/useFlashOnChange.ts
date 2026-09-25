import { useEffect, useRef, useState } from 'react';
import type { Wallet } from '../types/models';

const FLASH_MS = 1200;

/**
 * Returns the wallet fields whose value changed on the latest update, so a
 * balance can be highlighted for a moment when a game or the spin wheel pays
 * out. The wallet is re-read through AppContext on every `emitAppData`, which
 * is what makes the rewards page update live.
 */
export function useFlashOnChange(wallet: Wallet, keys: (keyof Wallet)[]): Set<string> {
  const previous = useRef<Record<string, number> | null>(null);
  const [flashed, setFlashed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const before = previous.current;
    previous.current = Object.fromEntries(keys.map((key) => [key, wallet[key] as number]));

    if (!before) return;

    const changed = keys.filter((key) => before[key] !== wallet[key]);
    if (changed.length === 0) return;

    setFlashed(new Set(changed));
    const timer = window.setTimeout(() => setFlashed(new Set()), FLASH_MS);
    return () => window.clearTimeout(timer);
    // `keys` is a module-level constant at every call site, so it is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, wallet.updatedAt]);

  return flashed;
}
