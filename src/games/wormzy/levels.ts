export type WormzyTile = 'empty' | 'stone' | 'bomb';

export interface WormzyPoint {
  x: number;
  y: number;
}

export type WormzyDirection = 'up' | 'down' | 'left' | 'right';

export const WORMZY_DIRECTIONS: Record<WormzyDirection, WormzyPoint> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export interface WormzyLevelPlan {
  size: number;
  stones: number;
  bombs: number;
  walls: number;
}

export interface WormzyLevel {
  index: number;
  size: number;
  tiles: WormzyTile[][];
  start: WormzyPoint;
  goal: WormzyPoint;
  plan: WormzyLevelPlan;
}

export const TOTAL_LEVELS = 15;
export const LEVEL_SECONDS = 10;

/**
 * Difficulty curve: the board grows, then stones, walls and bombs are added.
 * Levels 1-3 (7x7) → 4-6 (8x8) → 7-9 (9x9) → 10-12 (10x10) → 13-14 (11x11) → 15 (12x12).
 */
export const LEVEL_PLANS: readonly WormzyLevelPlan[] = [
  { size: 7, stones: 4, bombs: 1, walls: 0 },
  { size: 7, stones: 5, bombs: 1, walls: 0 },
  { size: 7, stones: 6, bombs: 1, walls: 0 },
  { size: 8, stones: 8, bombs: 2, walls: 1 },
  { size: 8, stones: 10, bombs: 2, walls: 1 },
  { size: 8, stones: 12, bombs: 2, walls: 1 },
  { size: 9, stones: 14, bombs: 3, walls: 1 },
  { size: 9, stones: 17, bombs: 3, walls: 2 },
  { size: 9, stones: 20, bombs: 3, walls: 2 },
  { size: 10, stones: 22, bombs: 4, walls: 2 },
  { size: 10, stones: 25, bombs: 4, walls: 2 },
  { size: 10, stones: 28, bombs: 4, walls: 3 },
  { size: 11, stones: 30, bombs: 6, walls: 3 },
  { size: 11, stones: 34, bombs: 6, walls: 3 },
  { size: 12, stones: 40, bombs: 7, walls: 4 },
];

const MAX_GENERATION_ATTEMPTS = 40;

/** Deterministic PRNG so every player gets the same, pre-validated layouts. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(max: number, random: () => number): number {
  return Math.floor(random() * max);
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1, random);
    const swap = copy[i];
    copy[i] = copy[j];
    copy[j] = swap;
  }
  return copy;
}

function pointKey(point: WormzyPoint): string {
  return `${point.x}:${point.y}`;
}

function inBounds(point: WormzyPoint, size: number): boolean {
  return point.x >= 0 && point.y >= 0 && point.x < size && point.y < size;
}

/** Right/down walk from the start cell to the goal cell — always a valid route. */
function buildRoute(size: number, random: () => number): WormzyPoint[] {
  const route: WormzyPoint[] = [{ x: 0, y: 0 }];
  let x = 0;
  let y = 0;
  while (x < size - 1 || y < size - 1) {
    const canRight = x < size - 1;
    const canDown = y < size - 1;
    const goRight = canRight && (!canDown || random() < 0.5);
    if (goRight) x += 1;
    else y += 1;
    route.push({ x, y });
  }
  return route;
}

function emptyTiles(size: number): WormzyTile[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 'empty' as WormzyTile),
  );
}

/**
 * Breadth-first search that treats stones and bombs as blocked cells and
 * returns the number of steps of the shortest safe route, or -1 if the goal
 * cannot be reached. Used to validate every generated level.
 */
export function shortestSafeDistance(
  tiles: WormzyTile[][],
  start: WormzyPoint,
  goal: WormzyPoint,
): number {
  const size = tiles.length;
  if (!inBounds(start, size) || !inBounds(goal, size)) return -1;
  if (tiles[start.y][start.x] !== 'empty' || tiles[goal.y][goal.x] !== 'empty') return -1;

  const seen = new Set<string>([pointKey(start)]);
  let frontier: WormzyPoint[] = [start];
  let distance = 0;

  while (frontier.length > 0) {
    const next: WormzyPoint[] = [];
    for (const cell of frontier) {
      if (cell.x === goal.x && cell.y === goal.y) return distance;
      for (const step of Object.values(WORMZY_DIRECTIONS)) {
        const candidate = { x: cell.x + step.x, y: cell.y + step.y };
        if (!inBounds(candidate, size)) continue;
        const key = pointKey(candidate);
        if (seen.has(key)) continue;
        if (tiles[candidate.y][candidate.x] !== 'empty') continue;
        seen.add(key);
        next.push(candidate);
      }
    }
    frontier = next;
    distance += 1;
  }

  return -1;
}

export function hasSafePath(tiles: WormzyTile[][], start: WormzyPoint, goal: WormzyPoint): boolean {
  return shortestSafeDistance(tiles, start, goal) >= 0;
}

function generateLevel(index: number, attempt: number): WormzyLevel {
  const plan = LEVEL_PLANS[Math.min(index, LEVEL_PLANS.length - 1)];
  const { size } = plan;
  const random = createRandom(0x9e3779b1 + (index + 1) * 7919 + attempt * 104729);
  const tiles = emptyTiles(size);
  const start: WormzyPoint = { x: 0, y: 0 };
  const goal: WormzyPoint = { x: size - 1, y: size - 1 };

  const route = buildRoute(size, random);
  const routeKeys = new Set(route.map(pointKey));

  // Never cover the safe route, the start cell, the area around the start, or the goal.
  const protectedKeys = new Set<string>([pointKey(start), pointKey(goal)]);
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const cell = { x: start.x + dx, y: start.y + dy };
      if (inBounds(cell, size)) protectedKeys.add(pointKey(cell));
    }
  }

  const isReserved = (point: WormzyPoint): boolean =>
    !inBounds(point, size) ||
    routeKeys.has(pointKey(point)) ||
    protectedKeys.has(pointKey(point)) ||
    tiles[point.y][point.x] !== 'empty';

  const touchesRoute = (point: WormzyPoint): boolean =>
    Object.values(WORMZY_DIRECTIONS).some((step) =>
      routeKeys.has(pointKey({ x: point.x + step.x, y: point.y + step.y })),
    );

  // Short stone walls create detours without ever covering the safe route.
  // Wall cells count against the level's stone budget.
  let stonesPlaced = 0;
  let wallsPlaced = 0;
  let wallGuard = 0;
  while (wallsPlaced < plan.walls && wallGuard < 80) {
    wallGuard += 1;
    const vertical = random() < 0.5;
    const length = 2 + randomInt(2, random);
    const x = randomInt(size, random);
    const y = randomInt(size, random);
    const cells: WormzyPoint[] = [];
    for (let step = 0; step < length; step += 1) {
      cells.push(vertical ? { x, y: y + step } : { x: x + step, y });
    }
    if (cells.some(isReserved)) continue;
    if (stonesPlaced + cells.length > plan.stones) continue;
    for (const cell of cells) {
      tiles[cell.y][cell.x] = 'stone';
      stonesPlaced += 1;
    }
    wallsPlaced += 1;
  }

  const candidates: { point: WormzyPoint; nearRoute: boolean }[] = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const point = { x, y };
      if (isReserved(point)) continue;
      candidates.push({ point, nearRoute: touchesRoute(point) });
    }
  }

  // Bombs sit next to the safe route: tempting shortcuts become lethal.
  const bombPool = shuffle(
    candidates.filter((candidate) => candidate.nearRoute).map((candidate) => candidate.point),
    random,
  );
  const used = new Set<string>();
  let bombsPlaced = 0;
  for (const point of bombPool) {
    if (bombsPlaced >= plan.bombs) break;
    const key = pointKey(point);
    if (used.has(key)) continue;
    tiles[point.y][point.x] = 'bomb';
    used.add(key);
    bombsPlaced += 1;
  }

  // Stones first hug the route (false leads), then fill the rest of the board.
  const stonePool = shuffle(
    candidates.map((candidate) => candidate.point),
    random,
  );
  const orderedStones = [
    ...stonePool.filter((point) => touchesRoute(point)),
    ...stonePool.filter((point) => !touchesRoute(point)),
  ];
  for (const point of orderedStones) {
    if (stonesPlaced >= plan.stones) break;
    const key = pointKey(point);
    if (used.has(key)) continue;
    tiles[point.y][point.x] = 'stone';
    used.add(key);
    stonesPlaced += 1;
  }

  return { index, size, tiles, start, goal, plan };
}

/**
 * Builds a level and validates it with BFS. Layouts are deterministic per level
 * index and regenerated (with a different seed) whenever validation fails, so a
 * level can never ship without at least one safe route from start to goal.
 */
export function createLevel(index: number): WormzyLevel {
  const safeIndex = Math.max(0, Math.min(index, TOTAL_LEVELS - 1));

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const level = generateLevel(safeIndex, attempt);
    if (hasSafePath(level.tiles, level.start, level.goal)) return level;
  }

  // Safety net: an open board is always solvable, so a run can never soft-lock.
  const plan = LEVEL_PLANS[safeIndex];
  return {
    index: safeIndex,
    size: plan.size,
    tiles: emptyTiles(plan.size),
    start: { x: 0, y: 0 },
    goal: { x: plan.size - 1, y: plan.size - 1 },
    plan,
  };
}
