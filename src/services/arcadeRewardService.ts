import type { ArcadeReward } from '../games/shared/rewards';
import { db } from '../db/database';
import { emitAppData } from '../lib/events';
import { withLock } from '../lib/mutex';
import type { CurrencyKey } from '../types/models';

/**
 * Credits an arcade prize (Game Coin / Silver / Gold / Diamond) to the local
 * wallet, using the same IndexedDB wallet the rest of VELOOP Rewards uses.
 * Shared by every live game so a run can only ever pay out through one path.
 */
export async function grantArcadeReward(reward: ArcadeReward): Promise<void> {
  const entries = Object.entries(reward.credits) as [CurrencyKey, number][];
  if (entries.length === 0) return;

  await withLock(async () => {
    await db.transaction('rw', db.wallet, async () => {
      const wallet = await db.wallet.get('primary');
      if (!wallet) return;
      for (const [key, amount] of entries) {
        wallet[key] += amount;
      }
      wallet.updatedAt = Date.now();
      await db.wallet.put(wallet);
    });
    emitAppData();
  });
}
