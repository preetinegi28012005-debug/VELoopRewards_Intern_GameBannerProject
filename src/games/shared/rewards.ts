import coinImage from '../../assets/game_coin.jpeg';
import diamondImage from '../../assets/multi_gems.jpeg';
import goldImage from '../../assets/multi_VEs.jpeg';
import silverImage from '../../assets/multi_SVEs.jpeg';
import type { CurrencyKey } from '../../types/models';

export type ArcadeRewardId = 'none' | 'coin' | 'silver' | 'gold' | 'diamond';

export interface ArcadeReward {
  id: ArcadeRewardId;
  label: string;
  rangeLabel: string;
  blurb: string;
  image: string;
  credits: Partial<Record<CurrencyKey, number>>;
}

/**
 * Shared arcade prize tiers, using the existing VELOOP coin / silver / gold /
 * diamond artwork. Both live games (Wormzy and Aqua Fill) build their reward HUD
 * and end-of-run prize from this single source of truth.
 */
export const ARCADE_REWARDS: Record<ArcadeRewardId, ArcadeReward> = {
  none: {
    id: 'none',
    label: 'No reward',
    rangeLabel: 'Clear a level to earn',
    blurb: 'Clear at least one level to earn a reward.',
    image: coinImage,
    credits: {},
  },
  coin: {
    id: 'coin',
    label: 'Game Coin',
    rangeLabel: 'Levels 1–4',
    blurb: '25 Game Coins added to your wallet.',
    image: coinImage,
    credits: { gameCoins: 25 },
  },
  silver: {
    id: 'silver',
    label: 'Silver',
    rangeLabel: 'Levels 5–9',
    blurb: '6 Silver Coins and 20 Game Coins added to your wallet.',
    image: silverImage,
    credits: { sves: 6, gameCoins: 20 },
  },
  gold: {
    id: 'gold',
    label: 'Gold',
    rangeLabel: 'Levels 10–14',
    blurb: '4 Golden Coins and 30 Game Coins added to your wallet.',
    image: goldImage,
    credits: { ves: 4, gameCoins: 30 },
  },
  diamond: {
    id: 'diamond',
    label: 'Diamond',
    rangeLabel: 'All levels',
    blurb: '3 Diamonds and 50 Game Coins added to your wallet.',
    image: diamondImage,
    credits: { gems: 3, gameCoins: 50 },
  },
};

/** The four tiers shown in a game's reward HUD, with labels for that game's length. */
export function arcadeRewardTiers(totalLevels: number): ArcadeReward[] {
  return [
    ARCADE_REWARDS.coin,
    ARCADE_REWARDS.silver,
    { ...ARCADE_REWARDS.gold, rangeLabel: `Levels 10–${totalLevels - 1}` },
    { ...ARCADE_REWARDS.diamond, rangeLabel: `All ${totalLevels} levels` },
  ];
}

/**
 * Reward is driven by the highest level that was actually completed:
 * 1-4 → Game Coin, 5-9 → Silver, 10-<total> → Gold, all levels → Diamond.
 * A level that was only reached (never completed) never pays out.
 */
export function rewardForCompletedLevels(
  completedLevels: number,
  totalLevels: number,
): ArcadeReward {
  if (completedLevels >= totalLevels) return ARCADE_REWARDS.diamond;
  if (completedLevels >= 10) return ARCADE_REWARDS.gold;
  if (completedLevels >= 5) return ARCADE_REWARDS.silver;
  if (completedLevels >= 1) return ARCADE_REWARDS.coin;
  return ARCADE_REWARDS.none;
}
