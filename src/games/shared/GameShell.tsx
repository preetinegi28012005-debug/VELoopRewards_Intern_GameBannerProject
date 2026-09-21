import type { ReactNode } from 'react';
import { ENTRY_COST, REVIVE_COST } from '../../config/constants';
import { useWallet } from '../../context/AppContext';
import { formatNumber } from '../../lib/format';
import type { GameConfig } from '../../types/models';
import { GameArt } from '../../components/games/GameArt';
import { CoinIcon, TokenIcon } from '../../components/ui/Icons';
import { Modal } from '../../components/ui/Modal';
import type { OverState } from '../../hooks/usePlayableGame';

interface GameShellProps {
  game: GameConfig;
  phase: 'lobby' | 'playing' | 'over';
  timeLeft: number;
  hud?: ReactNode;
  error: string | null;
  onClearError: () => void;
  guideOpen: boolean;
  onOpenGuide: () => void;
  onCloseGuide: () => void;
  onStart: () => void;
  over: OverState | null;
  onPlayAgain: () => void;
  onRevive: () => void;
  onNoThanks: () => void;
  children: ReactNode;
}

export function GameShell({
  game,
  phase,
  timeLeft,
  hud,
  error,
  onClearError,
  guideOpen,
  onOpenGuide,
  onCloseGuide,
  onStart,
  over,
  onPlayAgain,
  onRevive,
  onNoThanks,
  children,
}: GameShellProps) {
  const wallet = useWallet();
  const canAfford = wallet.tokens >= ENTRY_COST;
  const canRevive = wallet.tokens >= REVIVE_COST;

  return (
    <div className="game-env" style={{ ['--game-accent' as string]: game.accent }}>
      <section className="game-lobby">
        <div className="game-lobby__art">
          <GameArt game={game} />
        </div>
        <div>
          <p className="eyebrow">VELOOP Arcade</p>
          <h1>{game.name}</h1>
          <p className="lead">{game.description}</p>
          <div className="lobby-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={onStart}
              disabled={!canAfford || phase === 'playing'}
            >
              {phase === 'playing' ? 'Match in progress' : `Start · ${ENTRY_COST} Tokens`}
            </button>
            <button type="button" className="btn btn--ghost" onClick={onOpenGuide}>
              How to play
            </button>
          </div>
          {!canAfford ? (
            <p className="warn">You need {ENTRY_COST} Tokens to enter this game.</p>
          ) : null}
        </div>
      </section>

      <section className="playfield-wrap" aria-live="polite">
        <div className="hud">
          <span>Time {timeLeft}s</span>
          {hud}
          <span className="hud__wallet">
            <TokenIcon /> {formatNumber(wallet.tokens)}
            <CoinIcon /> {formatNumber(wallet.gameCoins)}
          </span>
        </div>
        <div className={phase === 'playing' ? 'playfield playfield--live' : 'playfield'}>
          {children}
        </div>
      </section>

      <Modal open={guideOpen} title={`${game.name} guide`} onClose={onCloseGuide}>
        <ol className="guide-list">
          {game.guide.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </Modal>

      <Modal
        open={Boolean(error)}
        title="Not enough Tokens"
        onClose={onClearError}
        footer={
          <button type="button" className="btn btn--primary" onClick={onClearError}>
            Okay
          </button>
        }
      >
        <p>{error}</p>
      </Modal>

      <Modal
        open={phase === 'over' && Boolean(over)}
        title="Game over"
        onClose={onNoThanks}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={onNoThanks}>
              No thanks
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onRevive}
              disabled={!canRevive || over?.endedBy === 'complete'}
            >
              Revive · {REVIVE_COST} Tokens
            </button>
            <button type="button" className="btn btn--primary" onClick={onPlayAgain}>
              Play again
            </button>
          </>
        }
      >
        {over ? (
          <div className="over-grid">
            <p>
              <strong>{game.name}</strong>
            </p>
            <p>Score {over.score}</p>
            <p>{over.label}</p>
            <p>Accuracy {Math.round(over.accuracy * 100)}%</p>
            <p>
              <CoinIcon /> {over.coins} Game Coins earned
            </p>
            <p>
              <TokenIcon /> {over.tokensSpent} Tokens spent
            </p>
            <p>Revives used: {over.reviveCount}</p>
            {over.endedBy === 'complete' ? (
              <p>Round cleared — revive is for timeouts only.</p>
            ) : null}
            {!canRevive && over.endedBy !== 'complete' ? (
              <p className="warn">You need {REVIVE_COST} Tokens to revive.</p>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
