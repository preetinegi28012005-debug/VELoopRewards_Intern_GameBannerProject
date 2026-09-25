
import {
  LEVEL_PLANS,
  TOTAL_LEVELS,
  createLevel,
  fillForPath,
  hasSafeRoute,
  manhattan,
  shortestCells,
  obstacleKeys,
  timeLimitForLevel,
} from '../src/games/aqua/levels.ts';
import { rewardForCompletedLevels } from '../src/games/aqua/rewards.ts';


let failures = 0;
const fail = (msg: string) => {
  failures += 1;
  console.log(`FAIL ${msg}`);
};

const sources = new Set<string>();
const glasses = new Set<string>();

for (let index = 0; index < TOTAL_LEVELS; index += 1) {
  const plan = LEVEL_PLANS[index];
  const level = createLevel(index);

  const cells = shortestCells(level.cols, level.rows, level.source, level.glass, obstacleKeys(level));
  const man = manhattan(level.source, level.glass);
  const limit = timeLimitForLevel(index);
  const kinds = new Set(level.obstacles.map((o) => o.kind));
  const target = Math.round(level.targetFill * 100);

  if (!hasSafeRoute(level)) fail(`L${index + 1}: no safe route`);
  if (cells < 0) fail(`L${index + 1}: BFS could not reach the glass`);
  if (cells > man + plan.slack + 1) fail(`L${index + 1}: route too long (${cells} > ${man + plan.slack + 1})`);
  if (level.optimalCells !== cells) fail(`L${index + 1}: optimalCells mismatch`);
  if (level.obstacles.length === 0) fail(`L${index + 1}: no obstacles placed`);
  if (level.obstacles.length > plan.obstacles) fail(`L${index + 1}: too many obstacles`);
  if (level.cols !== plan.cols || level.rows !== plan.rows) fail(`L${index + 1}: wrong board size`);
  if (limit !== (index < 10 ? 10 : 15)) fail(`L${index + 1}: wrong time limit ${limit}`);
  if (target < 60 || target > 100) fail(`L${index + 1}: target out of range ${target}`);
  if (man < plan.minDistance) fail(`L${index + 1}: pipe/glass too close`);
  if (level.source.x === level.glass.x && level.source.y === level.glass.y)
    fail(`L${index + 1}: pipe and glass overlap`);

  // obstacles must never sit on the pipe, the glass, or their immediate ring
  const reserved = new Set<string>();
  for (const anchor of [level.source, level.glass]) {
    for (let dy = -1; dy <= 1; dy += 1)
      for (let dx = -1; dx <= 1; dx += 1)
        reserved.add(`${anchor.x + dx}:${anchor.y + dy}`);
  }
  for (const o of level.obstacles) {
    if (reserved.has(`${o.x}:${o.y}`)) fail(`L${index + 1}: obstacle on reserved cell ${o.x},${o.y}`);
    if (o.x < 0 || o.y < 0 || o.x >= level.cols || o.y >= level.rows)
      fail(`L${index + 1}: obstacle out of bounds`);
  }

  // determinism
  const again = createLevel(index);
  if (JSON.stringify(again) !== JSON.stringify(level)) fail(`L${index + 1}: not deterministic`);

  sources.add(`${level.source.x},${level.source.y}`);
  glasses.add(`${level.glass.x},${level.glass.y}`);

  // fill logic: optimal route = 100%, detours lose pressure
  if (fillForPath(level, level.optimalCells) !== 1) fail(`L${index + 1}: optimal route not 100%`);
  if (fillForPath(level, level.optimalCells + 1) >= 1) fail(`L${index + 1}: detour still 100%`);
  if (fillForPath(level, 1) !== 0) fail(`L${index + 1}: empty path should be 0%`);
  const detourFill = fillForPath(level, level.optimalCells * 2);
  if (!(detourFill > 0 && detourFill < 1)) fail(`L${index + 1}: detour fill not between 0 and 1`);

  console.log(
    `L${String(index + 1).padStart(2)} ${level.cols}x${level.rows} obs=${String(level.obstacles.length).padStart(2)}/${plan.obstacles} kinds=${kinds.size} pipe=${level.source.x},${level.source.y} glass=${level.glass.x},${level.glass.y} best=${level.optimalCells} man=${man} target=${target}% time=${limit}s`,
  );
}

if (sources.size < 12) fail(`pipe positions not varied enough (${sources.size} unique)`);
if (glasses.size < 12) fail(`glass positions not varied enough (${glasses.size} unique)`);

// obstacle count should generally increase across the run
const counts = LEVEL_PLANS.map((_, i) => createLevel(i).obstacles.length);
if (counts[19] <= counts[0]) fail(`difficulty does not grow (L1=${counts[0]} L20=${counts[19]})`);

// reward thresholds
const rewardChecks: [number, string][] = [
  [0, 'none'], [1, 'coin'], [4, 'coin'], [5, 'silver'], [9, 'silver'],
  [10, 'gold'], [14, 'gold'], [19, 'gold'], [20, 'diamond'],
];
for (const [completed, expected] of rewardChecks) {
  const actual = rewardForCompletedLevels(completed).id;
  if (actual !== expected) fail(`reward(${completed}) = ${actual}, expected ${expected}`);
}

console.log(`info  unique pipe positions = ${sources.size}, unique glass positions = ${glasses.size}`);
console.log(failures === 0 ? 'ALL AQUA LEVEL CHECKS PASSED' : `${failures} AQUA CHECK(S) FAILED`);
console.log(`info  unique pipe positions = ${sources.size}, unique glass positions = ${glasses.size}`);
console.log(
  failures === 0
    ? 'ALL AQUA LEVEL CHECKS PASSED'
    : `${failures} AQUA CHECK(S) FAILED`,
);

if (failures > 0) {
  throw new Error(`${failures} AQUA CHECK(S) FAILED`);
}
