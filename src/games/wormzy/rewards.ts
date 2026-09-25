import {
  ARCADE_REWARDS,
  arcadeRewardTiers,
  rewardForCompletedLevels as rewardForCompleted,
  type ArcadeReward,
  type ArcadeRewardId,
} from '../shared/rewards';
import { TOTAL_LEVELS } from './levels';

export type WormzyRewardId = ArcadeRewardId;
export type WormzyReward = ArcadeReward;

/** Wormzy uses the shared arcade tiers (see src/games/shared/rewards.ts). */
export const WORMZY_REWARDS = ARCADE_REWARDS;

/** Tiers shown in the reward HUD, in ascending value order. */
export const WORMZY_REWARD_TIERS: ArcadeReward[] = arcadeRewardTiers(TOTAL_LEVELS);

/**
 * Wormzy reward, driven by the highest level that was actually completed:
 * 1-4 → Game Coin, 5-9 → Silver, 10-14 → Gold, all 15 → Diamond.
 */
export function rewardForCompletedLevels(completedLevels: number): ArcadeReward {
  return rewardForCompleted(completedLevels, TOTAL_LEVELS);
}
