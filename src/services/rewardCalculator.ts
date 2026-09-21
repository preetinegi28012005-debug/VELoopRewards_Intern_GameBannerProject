import type { RewardBreakdown } from '../types/models';

export function calculateGameCoins(input: {
  score: number;
  accuracy: number;
  durationSeconds: number;
  elapsedSeconds: number;
}): RewardBreakdown {
  const safeScore = Math.max(0, input.score);
  const accuracy = Math.min(1, Math.max(0, input.accuracy));
  const pace = input.elapsedSeconds > 0 ? safeScore / input.elapsedSeconds : 0;

  const scorePart = Math.floor(safeScore / 4);
  const accuracyPart = Math.round(accuracy * 10);
  const pacePart = Math.min(8, Math.floor(pace));
  const coins = Math.max(0, Math.min(40, 4 + scorePart + accuracyPart + pacePart));

  let label = 'Keep practicing';
  if (coins >= 28) label = 'Outstanding run';
  else if (coins >= 18) label = 'Strong performance';
  else if (coins >= 10) label = 'Solid round';
  else if (coins > 0) label = 'Warm-up complete';

  return { score: safeScore, accuracy, coins, label };
}
