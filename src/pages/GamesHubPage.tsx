import { useState } from 'react';
import gamesAvatar from '../assets/games.png';
import { GAMES } from '../config/games';
import { useWallet } from '../context/AppContext';
import { formatNumber } from '../lib/format';
import { GameCard } from '../components/games/GameCard';
import { CoinIcon, TokenIcon } from '../components/ui/Icons';
import { Modal } from '../components/ui/Modal';
import type { GameConfig } from '../types/models';

export function GamesHubPage() {
  const wallet = useWallet();
  const [soon, setSoon] = useState<GameConfig | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);

  const playableGames = GAMES.filter((game) => game.status === 'playable');

  return (
    <div className="hub">
      <section className="hero">
        <div className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Premium arcade · local rewards</p>
            <h1>Play. Earn Game Coins. Redeem on your terms.</h1>
            <p className="lead">
              VELOOP Games is a fully offline rewards arcade. Tokens, coins, history and messages
              stay on this device — nothing is sent to a server.
            </p>
          </div>
          <div className="hero-art">
            <img className="hero-art__image" src={gamesAvatar} alt="Gamer bear avatar" />
          </div>
        </div>
        <div className="hero-wallets">
          <article>
            <TokenIcon />
            <div>
              <small>Token balance</small>
              <strong>{formatNumber(wallet.tokens)}</strong>
            </div>
          </article>
          <article>
            <CoinIcon />
            <div>
              <small>Game Coin balance</small>
              <strong>{formatNumber(wallet.gameCoins)}</strong>
            </div>
          </article>
        </div>
      </section>

      <section className="live-games-section">
        <div className="section-head">
          <h2>Live games</h2>
          <p>Two live games are ready to play right now.</p>
        </div>

        {/* Desktop: both games side-by-side */}
        <div className="live-games-desktop">
          {playableGames.map((game) => (
            <GameCard key={game.id} game={game} onComingSoon={setSoon} />
          ))}
        </div>

        {/* Mobile: one game at a time with sidebar */}
        <div className="live-games-mobile">
          <div className="live-games-mobile__main">
            <GameCard game={playableGames[mobileIndex]} onComingSoon={setSoon} />
          </div>
          <nav className="live-games-mobile__sidebar" aria-label="Switch live game">
            {playableGames.map((game, i) => (
              <button
                key={game.id}
                type="button"
                className={
                  i === mobileIndex
                    ? 'live-sidebar-btn live-sidebar-btn--active'
                    : 'live-sidebar-btn'
                }
                onClick={() => setMobileIndex(i)}
              >
                <span className="live-sidebar-btn__dot" style={{ ['--dot-color' as string]: game.accent }} />
                {game.name}
              </button>
            ))}
          </nav>
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>All 13 titles</h2>
          <p>Two are live. Eleven are coming soon and stay in the lineup for future drops.</p>
        </div>
        <div className="all-games-strip" aria-label="All games">
          {GAMES.map((game) => (
            <div className="all-games-strip__item" key={game.id}>
              <GameCard game={game} onComingSoon={setSoon} />
            </div>
          ))}
        </div>
      </section>

      <Modal
        open={Boolean(soon)}
        title="Coming soon"
        onClose={() => setSoon(null)}
        footer={
          <button type="button" className="btn btn--primary" onClick={() => setSoon(null)}>
            Back to the hub
          </button>
        }
      >
        <p>
          {soon?.name} is in the VELOOP lineup but not playable in this build. Tokens are not
          charged until a title is live.
        </p>
      </Modal>
    </div>
  );
}
