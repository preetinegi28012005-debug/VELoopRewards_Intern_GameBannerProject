import { DEMO_WALLET } from '../config/constants';
import { db } from './database';
import type { AppSettings, Wallet } from '../types/models';

export async function ensureSeeded(): Promise<void> {
  await db.transaction('rw', db.wallet, db.settings, async () => {
    const existing = await db.wallet.get('primary');
    if (existing) return;

    const now = Date.now();
    const wallet: Wallet = {
      id: 'primary',
      tokens: DEMO_WALLET.tokens,
      gameCoins: DEMO_WALLET.gameCoins,
      ves: DEMO_WALLET.ves,
      sves: DEMO_WALLET.sves,
      gems: DEMO_WALLET.gems,
      spins: DEMO_WALLET.spins,
      updatedAt: now,
    };
    const settings: AppSettings = {
      id: 'primary',
      guidesSeen: {},
      seededAt: now,
    };
    await db.wallet.put(wallet);
    await db.settings.put(settings);
  });
}
