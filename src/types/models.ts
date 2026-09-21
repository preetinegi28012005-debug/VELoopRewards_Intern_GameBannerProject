export type CurrencyKey = 'tokens' | 'gameCoins' | 'ves' | 'sves' | 'gems' | 'spins';

export interface Wallet {
  id: 'primary';
  tokens: number;
  gameCoins: number;
  ves: number;
  sves: number;
  gems: number;
  spins: number;
  updatedAt: number;
}

export type GameStatus = 'playable' | 'coming-soon';

export interface GameConfig {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  guide: string[];
  entryCost: number;
  status: GameStatus;
  accent: string;
  accentSoft: string;
  art:
    | 'tap'
    | 'memory'
    | 'numbers'
    | 'color'
    | 'coin'
    | 'runner'
    | 'maze'
    | 'orbit'
    | 'storm'
    | 'beat'
    | 'vault'
    | 'prism'
    | 'titan';
}

export type SessionStatus = 'playing' | 'completed' | 'abandoned';

export interface GameSession {
  id: string;
  gameId: string;
  gameName: string;
  score: number;
  result: string;
  gameCoinsEarned: number;
  tokensSpent: number;
  reviveCount: number;
  rewarded: boolean;
  status: SessionStatus;
  startedAt: number;
  endedAt: number | null;
}

export interface GameStat {
  gameId: string;
  plays: number;
  highScore: number;
  totalCoins: number;
  totalTokens: number;
  totalRevives: number;
  lastPlayedAt: number;
}

export type RewardKind = 'ves' | 'sves' | 'gems' | 'tokens' | 'spins';

export interface RewardOption {
  id: string;
  kind: RewardKind;
  title: string;
  description: string;
  quantity: number;
  cost: number;
}

export interface Redemption {
  id: string;
  rewardId: string;
  rewardTitle: string;
  kind: RewardKind;
  quantity: number;
  gameCoinsSpent: number;
  status: 'completed';
  createdAt: number;
}

export interface AppSettings {
  id: 'primary';
  guidesSeen: Record<string, boolean>;
  seededAt: number;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: number;
}

export interface RewardBreakdown {
  score: number;
  accuracy: number;
  coins: number;
  label: string;
}
