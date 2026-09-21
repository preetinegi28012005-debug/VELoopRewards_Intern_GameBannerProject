import { useCallback, useRef } from 'react';

export function useActionLock() {
  const locked = useRef(false);

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (locked.current) return undefined;
    locked.current = true;
    try {
      return await fn();
    } finally {
      locked.current = false;
    }
  }, []);

  return { run, isLocked: () => locked.current };
}
