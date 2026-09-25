import { useState } from 'react';
import { Link } from 'react-router-dom';
import { REWARD_OPTIONS } from '../config/rewards';
import { ARCADE_COINS, TOKEN_META } from '../config/currencies';
import { useWallet } from '../context/AppContext';
import { useActionLock } from '../hooks/useActionLock';
import { useFlashOnChange } from '../hooks/useFlashOnChange';
import { formatNumber } from '../lib/format';
import { redeemReward } from '../services/redeemService';
import { InsufficientBalanceError } from '../services/walletService';
import { CurrencyIcon } from '../components/ui/Icons';
import { Modal } from '../components/ui/Modal';
import type { CurrencyKey, RewardOption } from '../types/models';

const COIN_KEYS = ARCADE_COINS.map((coin) => coin.key) as CurrencyKey[];

export function RedeemPage() {
  const wallet = useWallet();
  const { run } = useActionLock();
  const [selected, setSelected] = useState<RewardOption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const flashed = useFlashOnChange(wallet, COIN_KEYS);

  const confirm = () => {
    if (!selected) return;
    void run(async () => {
      try {
        const record = await redeemReward(selected);
        setSuccess(`${record.rewardTitle} added to your wallet. ID ${record.id}`);
        setSelected(null);
      } catch (err) {
        setSelected(null);
        if (err instanceof InsufficientBalanceError) setError(err.message);
        else setError('Redemption could not be completed.');
      }
    });
  };

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Wallet conversion</p>
        <h1>Redeem Game Coins</h1>
        <p className="lead">
          Convert arcade coins into VELOOP currencies. Every swap is stored locally.
        </p>
        <div className="hero-wallets" aria-label="Available coins">
          {ARCADE_COINS.map((coin) => (
            <article
              key={coin.key}
              className={flashed.has(coin.key) ? 'coin-balance is-flashing' : 'coin-balance'}
            >
              <img className="currency-icon" src={coin.image} alt="" aria-hidden="true" />
              <div>
                <small>Available {coin.label}</small>
                <strong>{formatNumber(wallet[coin.key])}</strong>
              </div>
            </article>
          ))}
        </div>
        <p>
          <Link to="/redeem/history">View redemption history</Link>
        </p>
      </header>

      <div className="reward-grid">
        {REWARD_OPTIONS.map((option) => {
          const affordable = wallet.gameCoins >= option.cost;
          return (
            <article key={option.id} className="reward-card">
              <h2>{option.title}</h2>
              <p>{option.description}</p>
              <p className="reward-qty">
                +{option.quantity} {option.kind.toUpperCase()}
              </p>
              <p className="cost-pill">{option.cost} Game Coins</p>
              <button
                type="button"
                className="btn btn--primary"
                disabled={!affordable}
                onClick={() => setSelected(option)}
              >
                {affordable ? 'Redeem' : 'Need more coins'}
              </button>
            </article>
          );
        })}
      </div>

      <section className="wallet-strip" aria-label="Other balances">
        <span>
          <CurrencyIcon currency={TOKEN_META.key} /> {TOKEN_META.label}{' '}
          {formatNumber(wallet[TOKEN_META.key])}
        </span>
        <span>Spins {formatNumber(wallet.spins)}</span>
      </section>

      <Modal
        open={Boolean(selected)}
        title="Confirm redemption"
        onClose={() => setSelected(null)}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setSelected(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn--primary" onClick={confirm}>
              Confirm
            </button>
          </>
        }
      >
        {selected ? (
          <p>
            Spend {selected.cost} Game Coins to receive {selected.quantity} {selected.title}? This
            cannot be reversed.
          </p>
        ) : null}
      </Modal>

      <Modal open={Boolean(error)} title="Insufficient Game Coins" onClose={() => setError(null)}>
        <p>{error}</p>
      </Modal>
      <Modal open={Boolean(success)} title="Redemption complete" onClose={() => setSuccess(null)}>
        <p>{success}</p>
        <p>The reward was added to the wallet stored in this browser.</p>
      </Modal>
    </div>
  );
}
