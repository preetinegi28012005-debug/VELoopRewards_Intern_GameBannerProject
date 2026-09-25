import type { ArcadeReward, ArcadeRewardId } from './rewards';

interface RewardDisplayProps {
  activeRewardId: ArcadeRewardId;
  tiers: ArcadeReward[];
  /** CSS class prefix so each game can theme the reward HUD (e.g. "wormzy", "aqua"). */
  prefix?: string;
}

/** Reward HUD: the four prizes on offer, with the tier currently reached highlighted. */
export function RewardDisplay({ activeRewardId, tiers, prefix = 'arcade' }: RewardDisplayProps) {
  return (
    <div className={`${prefix}-rewards`} aria-label="Available rewards">
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className={
            tier.id === activeRewardId
              ? `${prefix}-reward ${prefix}-reward--active`
              : `${prefix}-reward`
          }
        >
          <img src={tier.image} alt={`${tier.label} reward`} />
          <span>
            <strong>{tier.label}</strong>
            <small>{tier.rangeLabel}</small>
          </span>
        </div>
      ))}
    </div>
  );
}
