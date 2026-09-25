import { RewardDisplay } from '../shared/RewardDisplay';
import { Timer } from '../shared/Timer';
import { WORMZY_REWARD_TIERS, rewardForCompletedLevels } from './rewards';

interface GameHUDProps {
  levelNumber: number;
  totalLevels: number;
  seconds: number;
  totalSeconds: number;
  highestCompleted: number;
  live: boolean;
}

/** Top-of-screen HUD: reward tiers plus level, level timer and progress. */
export function GameHUD({
  levelNumber,
  totalLevels,
  seconds,
  totalSeconds,
  highestCompleted,
  live,
}: GameHUDProps) {
  const projected = rewardForCompletedLevels(highestCompleted);

  return (
    <div className="wormzy-hud">
      <RewardDisplay
        activeRewardId={projected.id}
        tiers={WORMZY_REWARD_TIERS}
        prefix="wormzy"
      />
      <div className="wormzy-hud__stats">
        <span className="wormzy-chip">
          Level <strong>{levelNumber}</strong> / {totalLevels}
        </span>
        <Timer seconds={seconds} totalSeconds={totalSeconds} live={live} prefix="wormzy" />
        <span className="wormzy-chip">
          Cleared <strong>{highestCompleted}</strong>
        </span>
      </div>
    </div>
  );
}
