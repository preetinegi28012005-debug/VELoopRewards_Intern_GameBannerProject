import gameCoinImage from '../assets/game_coin.jpeg';
import silverImage from '../assets/multi_SVEs.jpeg';
import goldImage from '../assets/multi_VEs.jpeg';
import diamondImage from '../assets/multi_gems.jpeg';
import tokenImage from '../assets/multi_token.jpeg';
import type { CurrencyKey } from '../types/models';

export interface CurrencyMeta {
  /** Wallet field this currency is stored in. */
  key: CurrencyKey;
  /** Name used in labels, the redeem cards and tooltips. */
  label: string;
  image: string;
}

/**
 * The arcade coin tiers, from lowest to highest value. Games award these
 * (see src/games/shared/rewards.ts) and the spin wheel pays them out, so this
 * list is the single place that maps a currency to its artwork.
 */
export const ARCADE_COINS: CurrencyMeta[] = [
  { key: 'gameCoins', label: 'Game Coins', image: gameCoinImage },
  { key: 'sves', label: 'Silver Coins', image: silverImage },
  { key: 'ves', label: 'Golden Coins', image: goldImage },
  { key: 'gems', label: 'Diamonds', image: diamondImage },
];

/** Spins are the only currency without their own artwork yet. */
export const SPIN_META: CurrencyMeta = { key: 'spins', label: 'Spins', image: tokenImage };

export const TOKEN_META: CurrencyMeta = { key: 'tokens', label: 'Tokens', image: tokenImage };
