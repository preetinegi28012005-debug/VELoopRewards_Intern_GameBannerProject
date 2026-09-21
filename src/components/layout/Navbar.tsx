import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { APP_NAME } from '../../config/constants';
import { useWallet } from '../../context/AppContext';
import { formatNumber } from '../../lib/format';
import { CloseIcon, CoinIcon, MenuIcon, TokenIcon } from '../ui/Icons';

const LINKS = [
  { to: '/games', label: 'Games' },
  { to: '/spin', label: 'Spin' },
  { to: '/history', label: 'GameHistory' },
  { to: '/redeem', label: 'Rewards' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const light = location.pathname.startsWith('/games/') && location.pathname !== '/games';

  return (
    <header className={light ? 'nav nav--light' : 'nav'}>
      <div className="nav__inner">
        <NavLink to="/games" className="brand" onClick={() => setOpen(false)}>
          <img className="brand__logo" src={logo} alt={`${APP_NAME} logo`} />
        </NavLink>

        <nav className="nav__links" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/games'}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav__wallet" aria-label="Wallet balances">
          <span className="wallet-chip">
            <TokenIcon />
            <span>
              <small>Tokens</small>
              <b>{formatNumber(wallet.tokens)}</b>
            </span>
          </span>
          <span className="wallet-chip wallet-chip--coin">
            <CoinIcon />
            <span>
              <small>Game Coins</small>
              <b>{formatNumber(wallet.gameCoins)}</b>
            </span>
          </span>
        </div>

        <button
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {open ? (
        <div className="nav__drawer">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>
              {link.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </header>
  );
}
