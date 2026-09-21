import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { GameConfig } from '../../types/models';
import { TokenIcon } from '../ui/Icons';
import { Modal } from '../ui/Modal';
import { GameArt } from './GameArt';

interface GameCardProps {
  game: GameConfig;
  onComingSoon: (game: GameConfig) => void;
}

export function GameCard({ game, onComingSoon }: GameCardProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const playable = game.status === 'playable';

  const action = playable ? (
    <Link className="play-btn" to={`/games/${game.slug}`}>
      <span>Play Now</span>
    </Link>
  ) : (
    <button type="button" className="play-btn" onClick={() => onComingSoon(game)}>
      <span>Play Now</span>
    </button>
  );

  return (
    <>
      <article className="game-card" style={{ ['--card-accent' as string]: game.accent }}>
        <div className="game-card__art">
          <GameArt game={game} />
          <div className="game-card__header">
            {!playable ? (
              <span className="badge">Coming Soon</span>
            ) : (
              <span className="badge badge--live">Live</span>
            )}
            <button
              type="button"
              className="info-btn"
              aria-label={`More info about ${game.name}`}
              onClick={() => setInfoOpen(true)}
              title={`How to play ${game.name}`}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
        <div className="game-card__body">
          <h3>{game.name}</h3>
          <p>{game.tagline}</p>
          <div className="game-card__meta">
            <span className="cost-pill">
              <TokenIcon />
              {game.entryCost} Tokens
            </span>
            {action}
          </div>
        </div>
      </article>

      <Modal
        open={infoOpen}
        title={game.name}
        onClose={() => setInfoOpen(false)}
        footer={
          <button type="button" className="btn btn--primary" onClick={() => setInfoOpen(false)}>
            Close
          </button>
        }
      >
        <div className="game-info">
          <p className="game-info__tagline">{game.tagline}</p>
          <p>{game.description}</p>
          <ul className="guide-list">
            {game.guide.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      </Modal>
    </>
  );
}
