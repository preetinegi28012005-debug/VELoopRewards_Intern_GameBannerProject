import { DEMO_WALLET } from '../config/constants';
import { db } from '../db/database';
import { emitAppData, onAppData } from '../lib/events';
import { withLock } from '../lib/mutex';
import type { Wallet } from '../types/models';

export class InsufficientBalanceError extends Error {
  constructor(message = 'Insufficient balance') {
    super(message);
    this.name = 'InsufficientBalanceError';
  }
}

export async function getWallet(): Promise<Wallet> {
  const wallet = await db.wallet.get('primary');
  if (!wallet) {
    throw new Error('Wallet is not initialized');
  }
  return wallet;
}

export function subscribeWallet(listener: (wallet: Wallet) => void): () => void {
  const onChange = () => {
    void getWallet().then(listener);
  };
  const unsubscribe = onAppData(onChange);
  onChange();
  return unsubscribe;
}

export async function resetAllLocalData(): Promise<void> {
  await withLock(async () => {
    await db.transaction(
      'rw',
      db.wallet,
      db.sessions,
      db.stats,
      db.redemptions,
      db.settings,
      async () => {
        await Promise.all([
          db.wallet.clear(),
          db.sessions.clear(),
          db.stats.clear(),
          db.redemptions.clear(),
          db.settings.clear(),
        ]);
        const now = Date.now();
        await db.wallet.put({
          id: 'primary',
          tokens: DEMO_WALLET.tokens,
          gameCoins: DEMO_WALLET.gameCoins,
          ves: DEMO_WALLET.ves,
          sves: DEMO_WALLET.sves,
          gems: DEMO_WALLET.gems,
          spins: DEMO_WALLET.spins,
          updatedAt: now,
        });
        await db.settings.put({
          id: 'primary',
          guidesSeen: {},
          seededAt: now,
        });
      },
    );

    await db.transaction('rw', db.contacts, async () => {
      await db.contacts.clear();
    });
    emitAppData();
  });
}
