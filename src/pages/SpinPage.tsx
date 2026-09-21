import { useEffect, useState } from 'react';
import { db } from '../db/database';
import { emitAppData } from '../lib/events';
import { useWallet } from '../context/AppContext';
import { formatNumber } from '../lib/format';
import { Modal } from '../components/ui/Modal';
import gameCoinImage from '../assets/game_coin.jpeg';
import tokenImage from '../assets/multi_token.jpeg';
import sveImage from '../assets/multi_SVEs.jpeg';
import veImage from '../assets/multi_VEs.jpeg';
import gemImage from '../assets/multi_gems.jpeg';

const PRIZES = [
  {
    id: 'token',
    label: 'Tokens',
    key: 'tokens',
    value: 30,
    image: tokenImage,
    color: '#48d5ff',
  },
  {
    id: 'coin',
    label: 'Game Coins',
    key: 'gameCoins',
    value: 50,
    image: gameCoinImage,
    color: '#f0bc3e',
  },
  {
    id: 'silver',
    label: 'Silver Coin',
    key: 'sves',
    value: 12,
    image: sveImage,
    color: '#b8c5d5',
  },
  {
    id: 'gold',
    label: 'Golden Coin',
    key: 'ves',
    value: 8,
    image: veImage,
    color: '#ffcd5d',
  },
  {
    id: 'diamond',
    label: 'Diamonds',
    key: 'gems',
    value: 5,
    image: gemImage,
    color: '#6ef3d6',
  },
] as const;

const SEGMENT_DEG = 360 / PRIZES.length;
const SPIN_TURNS = 3;

export function SpinPage() {
  const wallet = useWallet();
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<(typeof PRIZES)[number] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (!celebrating) return;
    const timer = window.setTimeout(() => setCelebrating(false), 3600);
    return () => window.clearTimeout(timer);
  }, [celebrating]);

  const walletSummary = [
    { label: 'Game Coins', value: formatNumber(wallet.gameCoins) },
    { label: 'Tokens', value: formatNumber(wallet.tokens) },
    { label: 'Silver Coin', value: formatNumber(wallet.sves) },
    { label: 'Golden Coin', value: formatNumber(wallet.ves) },
    { label: 'Diamonds', value: formatNumber(wallet.gems) },
  ];

  const spin = async () => {
    if (wallet.spins <= 0) {
      setMessage('No spins left. Come back later or earn more.');
      return;
    }

    const selectedIndex = Math.floor(Math.random() * PRIZES.length);
    const selected = PRIZES[selectedIndex];
    const selectedAngle = selectedIndex * SEGMENT_DEG + SEGMENT_DEG / 2;
    const currentAngle = ((rotation % 360) + 360) % 360;
    const correction = (360 - ((currentAngle + selectedAngle) % 360)) % 360;
    const targetRotation = rotation + SPIN_TURNS * 360 + correction;

    setIsSpinning(true);
    setMessage(null);
    setWinner(null);
    setRotation(targetRotation);

    await new Promise((resolve) => setTimeout(resolve, 2600));

    const current = await db.wallet.get('primary');
    if (!current) {
      setIsSpinning(false);
      setMessage('Wallet not found.');
      return;
    }

    current.spins -= 1;
    current[selected.key] += selected.value;
    current.updatedAt = Date.now();

    await db.wallet.put(current);
    emitAppData();
    setWinner(selected);
    setMessage(`You won ${selected.label}!`);
    setCelebrating(true);
    setIsSpinning(false);
  };

  return (
    <div className="page spin-page">
      {celebrating ? (
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 24 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
      ) : null}
      <header className="spin-header">
        <div>
          <p className="eyebrow">Lucky Draw</p>
          <h1>Spin the wheel !</h1>
        </div>
        <div className="spin-badge">{wallet.spins} spins left</div>
      </header>

      <section className="spin-stage">
        <div className="spin-visual">
          <div className="spin-wheel-shell">
            <div className="spin-pointer" aria-hidden="true" />
            <div className="spin-wheel" style={{ transform: `rotate(${rotation}deg)` }}>
              <div className="spin-wheel__ring" />
              <div className="spin-wheel__inner" />
              {PRIZES.map((prize, index) => {
                const angle = index * SEGMENT_DEG + SEGMENT_DEG / 2;
                return (
                  <div
                    key={prize.id}
                    className="spin-prize"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-140px) rotate(${-angle}deg)`,
                      background: prize.color,
                    }}
                  >
                    <img src={prize.image} alt={prize.label} />
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn btn--primary spin-button"
              onClick={spin}
              disabled={isSpinning || wallet.spins <= 0}
            >
              {isSpinning ? 'Spinning...' : wallet.spins > 0 ? 'Spin now' : 'No spins left'}
            </button>
          </div>

          {message ? <p className="spin-result">{message}</p> : null}
        </div>
      </section>

      <section className="spin-lower">
        <div className="spin-box">
          <h2>Wallet</h2>
          <div className="wallet-summary__list">
            {walletSummary.map((item) => (
              <div key={item.label} className="wallet-summary__item">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="spin-box">
          <h2>Prize list</h2>
          <div className="spin-reward-grid">
            {PRIZES.map((prize) => (
              <div key={prize.id} className="spin-reward-card">
                <img src={prize.image} alt={prize.label} />
                <div>
                  <strong>{prize.label}</strong>
                  <span>{prize.value} each</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Modal
        open={Boolean(winner)}
        title={`You won ${winner?.label ?? ''}`}
        onClose={() => setWinner(null)}
        footer={
          <button type="button" className="btn btn--primary" onClick={() => setWinner(null)}>
            Continue
          </button>
        }
      >
        {winner ? (
          <div className="spin-win-popup">
            <img src={winner.image} alt={winner.label} />
            <p>
              {winner.label} added to your wallet. Total reward: {winner.value}
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
