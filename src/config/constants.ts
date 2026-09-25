export const APP_NAME = 'VELOOP Games';

export const ENTRY_COST = 20;
export const REVIVE_COST = 10;

export const DEMO_WALLET = {
  tokens: 150,
  gameCoins: 50,
  ves: 2,
  sves: 1,
  gems: 8,
  spins: 3,
} as const;

export const GAME_DURATION = {
  // Wormzy plays 15 levels of 10 seconds; the session clock only measures elapsed run time.
  'vault-breaker': 150,
  // Aqua Fill plays 20 levels (10s each, then 15s) — same idea: elapsed run time.
  'prism-drift': 260,
} as const;

export const REVIVE_BONUS_SECONDS = 12;
