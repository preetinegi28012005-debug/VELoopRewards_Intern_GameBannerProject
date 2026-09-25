import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../src/context/AppContext';
import { GameBoard } from '../src/games/wormzy/GameBoard';
import { GameControls } from '../src/games/wormzy/GameControls';
import { GameHUD } from '../src/games/wormzy/GameHUD';
import { ResultModal } from '../src/games/wormzy/ResultModal';
import { WormzyGame } from '../src/games/wormzy/WormzyGame';
import { TOTAL_LEVELS, createLevel } from '../src/games/wormzy/levels';
import { WORMZY_REWARDS } from '../src/games/wormzy/rewards';
import { AquaFillGame } from '../src/games/AquaFillGame';
import { GamesHubPage } from '../src/pages/GamesHubPage';
import { RedeemPage } from '../src/pages/RedeemPage';
import { ARCADE_COINS } from '../src/config/currencies';

const level15 = createLevel(TOTAL_LEVELS - 1);
const checks: [string, boolean][] = [];

// 1. The real route target renders (lobby state, level 1 board, hero, reward HUD).
const lobby = renderToStaticMarkup(
  <MemoryRouter>
    <AppProvider>
      <WormzyGame />
    </AppProvider>
  </MemoryRouter>,
);
const cellCount = (lobby.match(/aria-label="Column/g) ?? []).length;
checks.push(['WormzyGame renders (/games/wormzy)', lobby.includes('game-env wormzy')]);
checks.push(['hero shows the Wormzy name + description', lobby.includes('>Wormzy<')]);
checks.push(['level 1 board is a 7x7 grid', lobby.includes('--wormzy-cols:7') && cellCount === 49]);
checks.push([
  'level starts with the worm and the goal',
  lobby.includes('wormzy-worm') && lobby.includes('wormzy-goal'),
]);
checks.push(['level timer is visible at 10 seconds', lobby.includes('TIME: 10')]);
checks.push([
  'reward HUD lists Coin/Silver/Gold/Diamond',
  ['Game Coin', 'Silver', 'Gold', 'Diamond'].every((label) => lobby.includes(label)),
]);
checks.push(['run can be started from the screen', lobby.includes('Start run')]);
checks.push(['screen offers Back to V Loop', lobby.includes('Back to V Loop')]);
checks.push([
  'direction pad is present',
  ['Move up', 'Move down', 'Move left', 'Move right'].every((label) => lobby.includes(label)),
]);

// 2. Hardest level renders every tile type.
const board = renderToStaticMarkup(
  <GameBoard
    level={level15}
    worm={{ x: 2, y: 1 }}
    stepKey={3}
    blockedCell={{ x: 1, y: 1 }}
    blastCell={{ x: 4, y: 4 }}
    interactive
    onCellSelect={() => undefined}
  />,
);
const level15Cells = (board.match(/aria-label="Column/g) ?? []).length;
checks.push([
  'level 15 is a 12x12 grid',
  board.includes('--wormzy-cols:12') && level15Cells === 144,
]);
checks.push(['stones render as obstacles', board.includes('wormzy-cell--stone')]);
checks.push(['bombs render on the board', board.includes('wormzy-bomb')]);
checks.push([
  'blocked + blast feedback classes render',
  board.includes('wormzy-cell--blocked') && board.includes('wormzy-cell--blast'),
]);

// 3. HUD states: low-time warning + Gold tier highlight.
const hud = renderToStaticMarkup(
  <GameHUD
    levelNumber={12}
    totalLevels={TOTAL_LEVELS}
    seconds={2}
    totalSeconds={10}
    highestCompleted={11}
    live
  />,
);
checks.push([
  'timer warns when time is low',
  hud.includes('wormzy-timer--low') && hud.includes('TIME: 2'),
]);
checks.push([
  'current tier is highlighted',
  hud.includes('wormzy-reward--active') && hud.includes('Levels 10–14'),
]);

// 4. Controls can be disabled outside a run.
const controls = renderToStaticMarkup(<GameControls onMove={() => undefined} disabled />);
checks.push(['controls disable outside a run', controls.includes('disabled')]);

// 5. Result popup: bomb loss and full victory.
const defeat = renderToStaticMarkup(
  <ResultModal
    open
    victory={false}
    reason="bomb"
    highestCompleted={11}
    reward={WORMZY_REWARDS.gold}
    coinsEarned={21}
    canRestart
    onRestart={() => undefined}
    onBack={() => undefined}
    onDismiss={() => undefined}
  />,
);
checks.push([
  'defeat popup shows Game Over + bomb reason + highest level',
  defeat.includes('Game Over') && defeat.includes('You hit a bomb!') && defeat.includes('11 of 15'),
]);
checks.push([
  'defeat popup shows the Gold reward',
  defeat.includes('Gold') && defeat.includes('multi_VEs'),
]);
checks.push([
  'defeat popup offers Restart + Back to V Loop',
  defeat.includes('Restart Game') && defeat.includes('Back to V Loop'),
]);

const timeout = renderToStaticMarkup(
  <ResultModal
    open
    victory={false}
    reason="timeout"
    highestCompleted={0}
    reward={WORMZY_REWARDS.none}
    coinsEarned={0}
    canRestart
    onRestart={() => undefined}
    onBack={() => undefined}
    onDismiss={() => undefined}
  />,
);
checks.push(['timeout popup shows the right reason', /Time(&#x27;|')s up!/.test(timeout)]);

const victory = renderToStaticMarkup(
  <ResultModal
    open
    victory
    reason={null}
    highestCompleted={TOTAL_LEVELS}
    reward={WORMZY_REWARDS.diamond}
    coinsEarned={40}
    canRestart
    onRestart={() => undefined}
    onBack={() => undefined}
    onDismiss={() => undefined}
  />,
);
checks.push([
  'victory popup shows all 15 levels + Diamond',
  victory.includes('Congratulations!') &&
    victory.includes('All 15 Levels Completed!') &&
    victory.includes('multi_gems'),
]);

// 6. Regression: the rest of the VELOOP Rewards site still renders.
const hub = renderToStaticMarkup(
  <MemoryRouter>
    <AppProvider>
      <GamesHubPage />
    </AppProvider>
  </MemoryRouter>,
);
const playButtons = (hub.match(/Play Now/g) ?? []).length;
console.log(`info  hub Play Now buttons = ${playButtons}`);
checks.push([
  'games hub still renders every title with a Play Now button',
  playButtons >= 13,
]);

// The cards link to /games/:slug, so those slug routes must exist in App.tsx.
const appSource = readFileSync('src/App.tsx', 'utf8');
checks.push([
  'Play Now targets are routed (Wormzy + Aqua Fill slugs)',
  hub.includes('/games/vault-breaker') &&
    hub.includes('/games/prism-drift') &&
    appSource.includes('path="/games/vault-breaker"') &&
    appSource.includes('path="/games/prism-drift"'),
]);

const aqua = renderToStaticMarkup(
  <MemoryRouter>
    <AppProvider>
      <AquaFillGame />
    </AppProvider>
  </MemoryRouter>,
);
checks.push([
  'Aqua Fill (the other live game) still renders',
  aqua.includes('aqua-board') && aqua.includes('How to play'),
]);

// 7. Rewards page: every arcade coin gets its own live balance card, with artwork.
const redeem = renderToStaticMarkup(
  <MemoryRouter>
    <AppProvider>
      <RedeemPage />
    </AppProvider>
  </MemoryRouter>,
);

const expectedAssets = ['game_coin', 'multi_SVEs', 'multi_VEs', 'multi_gems'];
checks.push([
  'rewards page shows all four coin balances (Game/Silver/Gold/Diamond)',
  ARCADE_COINS.length === 4 &&
    ['Game Coins', 'Silver Coins', 'Golden Coins', 'Diamonds'].every((label) =>
      redeem.includes(`Available ${label}`),
    ),
]);
checks.push([
  'each coin balance card renders its own artwork',
  expectedAssets.every((asset) => redeem.includes(asset)),
]);
checks.push([
  'coin cards are driven by the shared currency config',
  ARCADE_COINS.every((coin) => typeof coin.image === 'string' && coin.image.length > 0),
]);
checks.push(['other balances (Tokens/Spins) are still shown', redeem.includes('Spins')]);

let failures = 0;
for (const [label, ok] of checks) {
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`);
}
console.log(failures === 0 ? 'ALL RENDER CHECKS PASSED' : `${failures} RENDER CHECK(S) FAILED`);
if (failures > 0) process.exit(1);
