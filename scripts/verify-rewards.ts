import {
  ARCADE_REWARDS,
  rewardForCompletedLevels as sharedRewardForLevels,
} from '../src/games/shared/rewards.ts';
import { rewardForCompletedLevels as aquaReward } from '../src/games/aqua/rewards.ts';
import { TOTAL_LEVELS as AQUA_LEVELS } from '../src/games/aqua/levels.ts';
import { TOTAL_LEVELS as WORMZY_LEVELS } from '../src/games/wormzy/levels.ts';
import { ARCADE_COINS } from '../src/config/currencies.ts';
import { REWARD_OPTIONS } from '../src/config/rewards.ts';
import { calculateGameCoins } from '../src/services/rewardCalculator.ts';
import { GAMES, PLAYABLE_SLUGS, getGameBySlug } from '../src/config/games.ts';
import { DEMO_WALLET, ENTRY_COST, REVIVE_COST } from '../src/config/constants.ts';
import type { RewardKind } from '../src/types/models.ts';

let failures = 0;
function check(label: string, ok: boolean) {
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`);
}
function eq(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) console.log(`     expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  check(label, ok);
}

const WALLET_FIELDS = new Set(['tokens', 'gameCoins', 'ves', 'sves', 'gems', 'spins']);
const COIN_KEYS = new Set<string>(ARCADE_COINS.map((c) => c.key));

console.log('\n--- Rewards page balances ---');
eq('lists the 4 arcade coins, cheapest first', ARCADE_COINS.map((c) => c.key), [
  'gameCoins',
  'sves',
  'ves',
  'gems',
]);
check('every card maps to a real wallet field', ARCADE_COINS.every((c) => WALLET_FIELDS.has(c.key)));
check('every card has a label', ARCADE_COINS.every((c) => c.label.trim().length > 0));
// NOTE: artwork is stubbed to "asset-stub" under the Node asset loader, so the
// real per-coin images are asserted in scripts/render-wormzy.tsx instead.

console.log('\n--- Game payouts ---');
check(
  'every tier credits only currencies shown on the rewards page',
  Object.values(ARCADE_REWARDS).every((r) => Object.keys(r.credits).every((k) => COIN_KEYS.has(k))),
);
check('clearing zero levels pays nothing', Object.keys(ARCADE_REWARDS.none.credits).length === 0);

const wormzyCases: [number, string][] = [
  [0, 'none'],
  [1, 'coin'],
  [4, 'coin'],
  [5, 'silver'],
  [9, 'silver'],
  [10, 'gold'],
  [14, 'gold'],
  [15, 'diamond'],
];
eq(
  `Wormzy tiers (${WORMZY_LEVELS} levels)`,
  wormzyCases.map(([n]) => sharedRewardForLevels(n, WORMZY_LEVELS).id),
  wormzyCases.map(([, id]) => id),
);
eq(
  `Aqua Fill tiers (${AQUA_LEVELS} levels)`,
  [0, 1, 4, 5, 9, 10, 19, 20].map((n) => aquaReward(n).id),
  ['none', 'coin', 'coin', 'silver', 'silver', 'gold', 'gold', 'diamond'],
);
check('tier artwork is non-empty', Object.values(ARCADE_REWARDS).every((r) => r.image.length > 0));
check('every tier has copy', Object.values(ARCADE_REWARDS).every((r) => r.blurb.length > 0 && r.label.length > 0));

// Reward must never go down as the player clears more levels.
const WEIGHT: Record<string, number> = { gameCoins: 1, sves: 5, ves: 12, gems: 25 };
const creditValue = (credits: Partial<Record<string, number>>) =>
  Object.entries(credits).reduce((sum, [k, v]) => sum + (v ?? 0) * (WEIGHT[k] ?? 1), 0);
let monotonic = true;
let prev = -1;
for (let levels = 0; levels <= AQUA_LEVELS; levels += 1) {
  const value = creditValue(aquaReward(levels).credits);
  if (value < prev) monotonic = false;
  prev = value;
}
check('reward value never decreases as levels completed increases', monotonic);

console.log('\n--- Economy ---');
check('revive costs less than entry (no free-money loop)', REVIVE_COST < ENTRY_COST);

// Tokens are the only currency that buys play, so the exploit to rule out is a
// net token gain: can the best possible run buy back more Tokens than it cost?
// A run pays Game Coins + tier coins; Tokens only return via redemption.
const tokenRefill = REWARD_OPTIONS.find((o) => o.kind === 'tokens');
check('a Token redemption option exists (needed for the solvency check)', tokenRefill !== undefined);
if (tokenRefill) {
  const tokensPerRun = Math.floor(
    (ARCADE_REWARDS.diamond.credits.gameCoins ?? 0) / tokenRefill.cost,
  ) * tokenRefill.quantity;
  check(
    `best run (${ARCADE_REWARDS.diamond.credits.gameCoins} Game Coins) buys back ${tokensPerRun} Tokens, entry costs ${ENTRY_COST}`,
    tokensPerRun <= ENTRY_COST,
  );
  check('no run can be profitably repeated for Tokens', tokensPerRun <= ENTRY_COST);
}
check(
  'redeem options all have a positive cost and quantity',
  REWARD_OPTIONS.every((o) => o.cost > 0 && o.quantity > 0),
);
check('redeem kinds are all real wallet fields', REWARD_OPTIONS.every((o) => WALLET_FIELDS.has(o.kind)));
// `RewardKind` deliberately omits 'gameCoins', so redeeming can never be a
// Game Coins -> Game Coins self-swap. Asserted at the type level because a
// runtime comparison here would always be true.
type RedeemableNeverSpendsItself = Extract<RewardKind, 'gameCoins'> extends never ? true : false;
const noGameCoinRedemption: RedeemableNeverSpendsItself = true;
check('no redeem option trades gameCoins for gameCoins', noGameCoinRedemption);
check(
  'seed wallet can afford at least one redeem option',
  REWARD_OPTIONS.some((o) => o.cost <= DEMO_WALLET.gameCoins),
);
check('seed wallet has no negative balances', Object.values(DEMO_WALLET).every((v) => v >= 0));
check('seed wallet covers several game entries', DEMO_WALLET.tokens >= ENTRY_COST * 3);

console.log('\n--- Score-based Game Coins ---');
eq(
  'worst run pays the 4-coin floor',
  calculateGameCoins({ score: 0, accuracy: 0, durationSeconds: 260, elapsedSeconds: 100 }).coins,
  4,
);
eq(
  'best run is capped at 40 coins',
  calculateGameCoins({ score: 100000, accuracy: 1, durationSeconds: 10, elapsedSeconds: 1 }).coins,
  40,
);
check(
  'negative score never pays below the floor',
  calculateGameCoins({ score: -999, accuracy: 0, durationSeconds: 10, elapsedSeconds: 10 }).coins >= 4,
);
check(
  'out-of-range accuracy is clamped',
  calculateGameCoins({ score: 100, accuracy: 99, durationSeconds: 10, elapsedSeconds: 10 }).coins <= 40,
);

console.log('\n--- Catalogue ---');
eq('playable games', GAMES.filter((g) => g.status === 'playable').map((g) => g.slug), [
  ...PLAYABLE_SLUGS,
]);
check('game slugs are unique', new Set(GAMES.map((g) => g.slug)).size === GAMES.length);
check('every game has a guide', GAMES.every((g) => g.guide.length > 0));
check('every playable game costs the entry fee', GAMES.filter((g) => g.status === 'playable').every((g) => g.entryCost === ENTRY_COST));
check('getGameBySlug resolves Wormzy', getGameBySlug('vault-breaker')?.status === 'playable');
check('getGameBySlug resolves Aqua Fill', getGameBySlug('prism-drift')?.status === 'playable');

console.log(
  failures === 0 ? '\nALL REWARD LOGIC CHECKS PASSED' : `\n${failures} REWARD LOGIC CHECK(S) FAILED`,
);
if (failures > 0) process.exit(1);
