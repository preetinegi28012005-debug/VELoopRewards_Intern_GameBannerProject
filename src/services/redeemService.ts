import { db } from '../db/database';
import { emitAppData } from '../lib/events';
import { createId } from '../lib/ids';
import { withLock } from '../lib/mutex';
import type { Redemption, RewardKind, RewardOption } from '../types/models';
import { InsufficientBalanceError } from './walletService';

const WALLET_FIELD: Record<RewardKind, 'ves' | 'sves' | 'gems' | 'tokens' | 'spins'> = {
  ves: 'ves',
  sves: 'sves',
  gems: 'gems',
  tokens: 'tokens',
  spins: 'spins',
};

export async function redeemReward(option: RewardOption): Promise<Redemption> {
  return withLock(async () => {
    return db.transaction('rw', db.wallet, db.redemptions, async () => {
      const wallet = await db.wallet.get('primary');
      if (!wallet) throw new Error('Wallet is not initialized');
      if (wallet.gameCoins < option.cost) {
        throw new InsufficientBalanceError('Not enough Game Coins for this reward.');
      }
      wallet.gameCoins -= option.cost;
      wallet[WALLET_FIELD[option.kind]] += option.quantity;
      wallet.updatedAt = Date.now();

      const record: Redemption = {
        id: createId('rdm'),
        rewardId: option.id,
        rewardTitle: option.title,
        kind: option.kind,
        quantity: option.quantity,
        gameCoinsSpent: option.cost,
        status: 'completed',
        createdAt: Date.now(),
      };
      await db.wallet.put(wallet);
      await db.redemptions.add(record);
      emitAppData();
      return record;
    });
  });
}

export async function listRedemptions(): Promise<Redemption[]> {
  return db.redemptions.orderBy('createdAt').reverse().toArray();
}
