export type AquaObstacleKind = 'stone' | 'block' | 'pillar' | 'wall';

export interface AquaPoint {
  x: number;
  y: number;
}

export interface AquaObstacle extends AquaPoint {
  kind: AquaObstacleKind;
}

export interface AquaLevelPlan {
  cols: number;
  rows: number;
  /** How many obstacles the generator should try to place. */
  obstacles: number;
  /** Glass fill required to clear the level (0.6 = 60%). */
  targetFill: number;
  /** Minimum Manhattan distance between the pipe and the glass. */
  minDistance: number;
  /** How many moves longer than the Manhattan distance the best route may be. */
  slack: number;
}

export interface AquaLevel {
  /** 0-based level index. */
  index: number;
  cols: number;
  rows: number;
  source: AquaPoint;
  glass: AquaPoint;
  targetFill: number;
  obstacles: AquaObstacle[];
  /** Cells on the shortest safe route (moves + 1) — the "best route" shown in the HUD. */
  optimalCells: number;
  plan: AquaLevelPlan;
}

export const TOTAL_LEVELS = 20;

/** Levels 1-10 give 10 seconds, levels 11-20 give 15 seconds. */
export const SHORT_LEVEL_SECONDS = 10;
export const LONG_LEVEL_SECONDS = 15;

export function timeLimitForLevel(index: number): number {
  return index < 10 ? SHORT_LEVEL_SECONDS : LONG_LEVEL_SECONDS;
}

/**
 * Difficulty curve: the board grows, obstacles multiply and the glass starts
 * demanding a much tighter route (targetFill climbs from 60% to 95%).
 */
export const LEVEL_PLANS: readonly AquaLevelPlan[] = [
  // 1-3: open space, a handful of obstacles, generous targets.
  { cols: 7, rows: 9, obstacles: 3, targetFill: 0.6, minDistance: 7, slack: 3 },
  { cols: 7, rows: 9, obstacles: 4, targetFill: 0.62, minDistance: 8, slack: 3 },
  { cols: 7, rows: 9, obstacles: 6, targetFill: 0.65, minDistance: 8, slack: 3 },
  // 4-7: more obstacles, narrower corridors, the first real turns.
  { cols: 8, rows: 10, obstacles: 8, targetFill: 0.7, minDistance: 9, slack: 3 },
  { cols: 8, rows: 10, obstacles: 10, targetFill: 0.72, minDistance: 10, slack: 3 },
  { cols: 8, rows: 10, obstacles: 12, targetFill: 0.75, minDistance: 10, slack: 3 },
  { cols: 8, rows: 10, obstacles: 14, targetFill: 0.75, minDistance: 11, slack: 2 },
  // 8-12: complex arrangements with several possible-looking routes.
  { cols: 9, rows: 11, obstacles: 16, targetFill: 0.78, minDistance: 12, slack: 2 },
  { cols: 9, rows: 11, obstacles: 18, targetFill: 0.8, minDistance: 12, slack: 2 },
  { cols: 9, rows: 11, obstacles: 20, targetFill: 0.8, minDistance: 13, slack: 2 },
  { cols: 9, rows: 11, obstacles: 22, targetFill: 0.82, minDistance: 13, slack: 2 },
  { cols: 9, rows: 11, obstacles: 24, targetFill: 0.85, minDistance: 14, slack: 2 },
  // 13-16: dense obstacles, narrow routes, precise drawing.
  { cols: 10, rows: 12, obstacles: 26, targetFill: 0.85, minDistance: 14, slack: 2 },
  { cols: 10, rows: 12, obstacles: 28, targetFill: 0.88, minDistance: 15, slack: 2 },
  { cols: 10, rows: 12, obstacles: 30, targetFill: 0.9, minDistance: 15, slack: 2 },
  { cols: 10, rows: 12, obstacles: 32, targetFill: 0.9, minDistance: 16, slack: 2 },
  // 17-19: maze-like boards with very few safe routes.
  { cols: 11, rows: 13, obstacles: 36, targetFill: 0.9, minDistance: 16, slack: 2 },
  { cols: 11, rows: 13, obstacles: 39, targetFill: 0.92, minDistance: 17, slack: 2 },
  { cols: 11, rows: 13, obstacles: 42, targetFill: 0.92, minDistance: 17, slack: 2 },
  // 20: the final puzzle — hardest board, tightest glass.
  { cols: 11, rows: 13, obstacles: 46, targetFill: 0.95, minDistance: 17, slack: 1 },
];

const STEP_DIRECTIONS: [number, number][] = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];

export function cellKey(point: AquaPoint): string {
  return `${point.x}:${point.y}`;
}

/** Deterministic PRNG (mulberry32) so every player gets the same 20 puzzles. */
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

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const swap = copy[i];
    copy[i] = copy[j];
    copy[j] = swap;
  }
  return copy;
}

/**
 * Breadth-first search over the board, treating the blocked set (obstacles) as
 * walls. Returns the number of cells on the shortest route (moves + 1), or -1
 * when the glass cannot be reached at all.
 */
export function shortestCells(
  cols: number,
  rows: number,
  source: AquaPoint,
  glass: AquaPoint,
  blocked: ReadonlySet<string>,
): number {
  if (blocked.has(cellKey(source)) || blocked.has(cellKey(glass))) return -1;

  const total = cols * rows;
  const distance = new Int32Array(total).fill(-1);
  const queue = new Int32Array(total);
  const start = source.y * cols + source.x;
  const goal = glass.y * cols + glass.x;
  let head = 0;
  let tail = 0;

  distance[start] = 0;
  queue[tail] = start;
  tail += 1;

  while (head < tail) {
    const current = queue[head];
    head += 1;
    if (current === goal) return distance[current] + 1;

    const cx = current % cols;
    const cy = (current - cx) / cols;
    for (const [dx, dy] of STEP_DIRECTIONS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const next = ny * cols + nx;
      if (distance[next] !== -1) continue;
      if (blocked.has(`${nx}:${ny}`)) continue;
      distance[next] = distance[current] + 1;
      queue[tail] = next;
      tail += 1;
    }
  }

  return -1;
}

export function samePoint(a: AquaPoint, b: AquaPoint): boolean {
  return a.x === b.x && a.y === b.y;
}

export function manhattan(a: AquaPoint, b: AquaPoint): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function isInside(level: Pick<AquaLevel, 'cols' | 'rows'>, point: AquaPoint): boolean {
  return point.x >= 0 && point.y >= 0 && point.x < level.cols && point.y < level.rows;
}

export function obstacleKeys(level: Pick<AquaLevel, 'obstacles'>): Set<string> {
  return new Set(level.obstacles.map(cellKey));
}

const MAX_GENERATION_ATTEMPTS = 30;

/** Pipe position: any border cell, so the source moves around between levels. */
function pickSource(cols: number, rows: number, random: () => number): AquaPoint {
  const edges: AquaPoint[] = [];
  for (let x = 0; x < cols; x += 1) {
    edges.push({ x, y: 0 });
    edges.push({ x, y: rows - 1 });
  }
  for (let y = 1; y < rows - 1; y += 1) {
    edges.push({ x: 0, y });
    edges.push({ x: cols - 1, y });
  }
  return edges[Math.floor(random() * edges.length)];
}

/** Glass position: never on the pipe, always at least `minDistance` away. */
function pickGlass(plan: AquaLevelPlan, source: AquaPoint, random: () => number): AquaPoint | null {
  const { cols, rows, minDistance } = plan;
  const options: AquaPoint[] = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const point = { x, y };
      if (manhattan(point, source) >= minDistance) options.push(point);
    }
  }
  if (options.length === 0) return null;
  return options[Math.floor(random() * options.length)];
}

/**
 * Pipe and glass are chosen together: a pipe that is too close to everything is
 * rejected, so every level really does separate them by `minDistance` or more.
 */
function pickSourceAndGlass(
  plan: AquaLevelPlan,
  random: () => number,
): { source: AquaPoint; glass: AquaPoint } {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const source = pickSource(plan.cols, plan.rows, random);
    const glass = pickGlass(plan, source, random);
    if (glass) return { source, glass };
  }
  // Opposite corners always give the widest separation the board allows.
  return { source: { x: 0, y: 0 }, glass: { x: plan.cols - 1, y: plan.rows - 1 } };
}


/** Cells kept clear so the pipe and the glass stay readable and approachable. */
function reservedKeys(plan: AquaLevelPlan, source: AquaPoint, glass: AquaPoint): Set<string> {
  const reserved = new Set<string>();
  for (const anchor of [source, glass]) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const point = { x: anchor.x + dx, y: anchor.y + dy };
        if (isInside(plan, point)) reserved.add(cellKey(point));
      }
    }
  }
  return reserved;
}

function pickKind(index: number, random: () => number): AquaObstacleKind {
  const early: AquaObstacleKind[] = ['stone', 'block'];
  const mid: AquaObstacleKind[] = ['stone', 'block', 'pillar'];
  const late: AquaObstacleKind[] = ['stone', 'block', 'pillar', 'wall'];
  const palette = index < 4 ? early : index < 8 ? mid : late;
  return palette[Math.floor(random() * palette.length)];
}

function generateLevel(index: number, attempt: number): AquaLevel {
  const plan = LEVEL_PLANS[index];
  const { cols, rows } = plan;
  const random = createRandom(0x51ed270b + (index + 1) * 7919 + attempt * 104729);

  const { source, glass } = pickSourceAndGlass(plan, random);
  const reserved = reservedKeys(plan, source, glass);
  const maxOptimalCells = manhattan(source, glass) + plan.slack + 1;

  const blocked = new Set<string>();
  const obstacles: AquaObstacle[] = [];
  const candidates: AquaPoint[] = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const point = { x, y };
      if (!reserved.has(cellKey(point))) candidates.push(point);
    }
  }

  // Add obstacles one at a time and re-validate with BFS, so the route always
  // survives: an obstacle that would seal the glass in is simply skipped.
  for (const point of shuffle(candidates, random)) {
    if (obstacles.length >= plan.obstacles) break;
    const key = cellKey(point);
    blocked.add(key);
    const cells = shortestCells(cols, rows, source, glass, blocked);
    if (cells < 0 || cells > maxOptimalCells) {
      blocked.delete(key);
      continue;
    }
    obstacles.push({ ...point, kind: pickKind(index, random) });
  }

  return {
    index,
    cols,
    rows,
    source,
    glass,
    targetFill: plan.targetFill,
    obstacles,
    optimalCells: shortestCells(cols, rows, source, glass, blocked),
    plan,
  };
}

/** Does the board still connect the pipe to the glass? */
export function hasSafeRoute(
  level: Pick<AquaLevel, 'cols' | 'rows' | 'source' | 'glass' | 'obstacles'>,
): boolean {
  return (
    shortestCells(level.cols, level.rows, level.source, level.glass, obstacleKeys(level)) > 0
  );
}

/** Builds a level, validating it with BFS and regenerating on any failure. */
export function createLevel(index: number): AquaLevel {
  const safeIndex = Math.max(0, Math.min(index, TOTAL_LEVELS - 1));
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const level = generateLevel(safeIndex, attempt);
    if (level.optimalCells > 0 && hasSafeRoute(level)) return level;
  }
  // Safety net: an open board is always solvable, so a run can never soft-lock.
  const plan = LEVEL_PLANS[safeIndex];
  return {
    index: safeIndex,
    cols: plan.cols,
    rows: plan.rows,
    source: { x: 0, y: 0 },
    glass: { x: plan.cols - 1, y: plan.rows - 1 },
    targetFill: plan.targetFill,
    obstacles: [],
    optimalCells: plan.cols + plan.rows - 1,
    plan,
  };
}

/**
 * How much water the glass receives for a drawn route. The shortest safe route
 * delivers 100%; every extra cell of detour costs pressure, so a long winding
 * line cannot fill a demanding glass.
 */
export function fillForPath(level: AquaLevel, pathCells: number): number {
  const moves = pathCells - 1;
  if (moves <= 0) return 0;
  const best = Math.max(1, level.optimalCells - 1);
  return Math.min(1, best / moves);
}
