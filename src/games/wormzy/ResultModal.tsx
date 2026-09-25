import wormzyBanner from '../../assets/11.jpeg';
import { Modal } from '../../components/ui/Modal';
import { TOTAL_LEVELS } from './levels';
import type { WormzyReward } from './rewards';

interface ResultModalProps {
  open: boolean;
  victory: boolean;
  reason: 'bomb' | 'timeout' | null;
  highestCompleted: number;
  reward: WormzyReward | null;
  coinsEarned: number;
  canRestart: boolean;
  onRestart: () => void;
  onBack: () => void;
  onDismiss: () => void;
}

/** Final popup: bomb, timeout or a full 15-level victory — always with the earned prize. */
export function ResultModal({
  open,
  victory,
  reason,
  highestCompleted,
  reward,
  coinsEarned,
  canRestart,
  onRestart,
  onBack,
  onDismiss,
}: ResultModalProps) {
  const reasonText = reason === 'bomb' ? 'You hit a bomb!' : "Time's up!";

  return (
    <Modal
      open={open}
      title={victory ? 'Congratulations!' : 'Game Over'}
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
            Restart Game
          </button>
        </>
      }
    >
      <div className={victory ? 'wormzy-result wormzy-result--victory' : 'wormzy-result'}>
        <img className="wormzy-result__art" src={wormzyBanner} alt="Wormzy" />
        <p className="wormzy-result__headline">
          {victory ? `All ${TOTAL_LEVELS} Levels Completed!` : reasonText}
        </p>
        <div className="wormzy-result__stats">
          <div className="wormzy-stat">
            <small>Highest level completed</small>
            <strong>
              {highestCompleted} of {TOTAL_LEVELS}
            </strong>
          </div>
          <div className="wormzy-stat">
            <small>Game Coins earned</small>
            <strong>{coinsEarned}</strong>
          </div>
        </div>
        <div className="wormzy-result__reward">
          <p className="eyebrow">🏆 Reward earned</p>
          {reward ? <img src={reward.image} alt={`${reward.label} reward`} /> : null}
          <strong className="wormzy-result__reward-label">{reward?.label ?? 'No reward'}</strong>
          <span>{reward?.blurb}</span>
        </div>
        {!canRestart ? (
          <p className="warn">You need more Tokens to restart. Redeem coins to keep playing.</p>
        ) : null}
      </div>
    </Modal>
  );
}
