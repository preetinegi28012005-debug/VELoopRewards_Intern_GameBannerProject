import {
  ARCADE_REWARDS,
  arcadeRewardTiers,
  rewardForCompletedLevels as rewardForCompleted,
  type ArcadeReward,
  type ArcadeRewardId,
} from '../shared/rewards';
import { TOTAL_LEVELS } from './levels';

export type AquaRewardId = ArcadeRewardId;
export type AquaReward = ArcadeReward;

/** Aqua Fill uses the shared arcade tiers (see src/games/shared/rewards.ts). */
export const AQUA_REWARDS = ARCADE_REWARDS;

/** Tiers shown in the reward HUD, in ascending value order. */
export const AQUA_REWARD_TIERS: ArcadeReward[] = arcadeRewardTiers(TOTAL_LEVELS);

/**
 * Aqua Fill reward, driven by the highest level actually completed:
 * 1-4 → Game Coin, 5-9 → Silver, 10-19 → Gold, all 20 → Diamond.
 */
export function rewardForCompletedLevels(completedLevels: number): ArcadeReward {
  return rewardForCompleted(completedLevels, TOTAL_LEVELS);
}
