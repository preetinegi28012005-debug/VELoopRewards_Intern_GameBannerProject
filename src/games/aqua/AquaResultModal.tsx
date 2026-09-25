import aquaBanner from '../../assets/12.jpeg';
import { Modal } from '../../components/ui/Modal';
import type { ArcadeReward } from '../shared/rewards';
import { TOTAL_LEVELS } from './levels';

interface AquaResultModalProps {
  open: boolean;
  victory: boolean;
  highestCompleted: number;
  reward: ArcadeReward | null;
  coinsEarned: number;
  canRestart: boolean;
  onRestart: () => void;
  onBack: () => void;
  onDismiss: () => void;
}

/** Final popup: time's up, or a full 20-level clear with the Diamond prize. */
export function AquaResultModal({
  open,
  victory,
  highestCompleted,
  reward,
  coinsEarned,
  canRestart,
  onRestart,
  onBack,
  onDismiss,
}: AquaResultModalProps) {
  return (
    <Modal
      open={open}
      title={victory ? '🎉 Congratulations!' : 'Game Over'}
      onClose={onDismiss}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            Back to V Loop
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onRestart}
            disabled={!canRestart}
          >
            {victory ? 'Play again' : 'Try again'}
          </button>
        </>
      }
    >
      <div className={victory ? 'aqua-result aqua-result--victory' : 'aqua-result'}>
        <img className="aqua-result__art" src={aquaBanner} alt="Aqua Fill" />
        <p className="aqua-result__headline">
          {victory ? `Aqua Fill Completed! ${TOTAL_LEVELS} / ${TOTAL_LEVELS} Levels` : "💧 Time's Up!"}
        </p>
        <div className="aqua-result__stats">
          <div className="aqua-stat">
            <small>Highest level completed</small>
            <strong>
              {highestCompleted} of {TOTAL_LEVELS}
            </strong>
          </div>
          <div className="aqua-stat">
            <small>Game Coins earned</small>
            <strong>{coinsEarned}</strong>
          </div>
        </div>
        <div className="aqua-result__reward">
          <p className="eyebrow">🏆 Reward earned</p>
          {reward ? <img src={reward.image} alt={`${reward.label} reward`} /> : null}
          <strong className="aqua-result__reward-label">{reward?.label ?? 'No reward'}</strong>
          <span>{reward?.blurb}</span>
        </div>
        {!canRestart ? (
          <p className="warn">You need more Tokens to restart. Redeem coins to keep playing.</p>
        ) : null}
      </div>
    </Modal>
  );
}
