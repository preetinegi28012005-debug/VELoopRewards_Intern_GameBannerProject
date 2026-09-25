import {
  LEVEL_PLANS,
  TOTAL_LEVELS,
  createLevel,
  shortestSafeDistance,
} from '../src/games/wormzy/levels.ts';
import { rewardForCompletedLevels } from '../src/games/wormzy/rewards.ts';

let failures = 0;

for (let index = 0; index < TOTAL_LEVELS; index += 1) {
  const plan = LEVEL_PLANS[index];
  const level = createLevel(index);
  const distance = shortestSafeDistance(level.tiles, level.start, level.goal);
  const minSteps = 2 * (level.size - 1);
  const flat = level.tiles.flat();
  const stones = flat.filter((tile) => tile === 'stone').length;
  const bombs = flat.filter((tile) => tile === 'bomb').length;
  const startFree = level.tiles[0][0] === 'empty';
  const goalFree = level.tiles[level.size - 1][level.size - 1] === 'empty';
  const repeat = createLevel(index);
  const deterministic =
    JSON.stringify(repeat.tiles) === JSON.stringify(level.tiles) &&
    shortestSafeDistance(repeat.tiles, repeat.start, repeat.goal) === distance;

  const ok =
    distance === minSteps &&
    stones === plan.stones &&
    bombs === plan.bombs &&
    level.size === plan.size &&
    startFree &&
    goalFree &&
    deterministic;

  if (!ok) failures += 1;
  console.log(
    `L${String(index + 1).padStart(2)} ${level.size}x${level.size} stones=${stones}/${plan.stones} bombs=${bombs}/${plan.bombs} safeSteps=${distance}/${minSteps} deterministic=${deterministic} ${ok ? 'OK' : 'FAIL'}`,
  );
}

function dumpBoard(index: number): void {
  const level = createLevel(index);
  console.log(`\nLevel ${index + 1} (${level.size}x${level.size})  W = worm  F = finish  S = stone  B = bomb`);
  for (let y = 0; y < level.size; y += 1) {
    let row = '';
    for (let x = 0; x < level.size; x += 1) {
      if (level.start.x === x && level.start.y === y) row += ' W';
      else if (level.goal.x === x && level.goal.y === y) row += ' F';
      else if (level.tiles[y][x] === 'stone') row += ' S';
      else if (level.tiles[y][x] === 'bomb') row += ' B';
      else row += ' .';
    }
    console.log(row);
  }
}

for (const index of [0, 7, 14]) dumpBoard(index);
console.log('');

const rewardChecks: [number, string][] = [
  [0, 'none'],
  [1, 'coin'],
  [4, 'coin'],
  [5, 'silver'],
  [9, 'silver'],
  [10, 'gold'],
  [14, 'gold'],
  [15, 'diamond'],
];

for (const [completed, expected] of rewardChecks) {
  const actual = rewardForCompletedLevels(completed).id;
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`reward(${completed}) = ${actual} (expected ${expected}) ${ok ? 'OK' : 'FAIL'}`);
}

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`);
if (failures > 0) process.exit(1);
