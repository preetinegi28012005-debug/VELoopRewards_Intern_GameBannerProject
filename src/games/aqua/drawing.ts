import { cellKey, manhattan, samePoint, type AquaPoint } from './levels';

/** How far a fast drag may jump before the line stops extending. */
const BRIDGE_LIMIT = 3;

const STEPS: [number, number][] = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];

/** Maps a client (pointer) position onto a board cell, or null when outside. */
export function cellFromClientPoint(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  cols: number,
  rows: number,
): AquaPoint | null {
  if (rect.width <= 0 || rect.height <= 0) return null;
  const x = Math.floor(((clientX - rect.left) / rect.width) * cols);
  const y = Math.floor(((clientY - rect.top) / rect.height) * rows);
  if (x < 0 || y < 0 || x >= cols || y >= rows) return null;
  return { x, y };
}

/** Tiny BFS that bridges small gaps through free cells only (never obstacles). */
function findBridge(
  from: AquaPoint,
  target: AquaPoint,
  isFree: (point: AquaPoint) => boolean,
): AquaPoint[] | null {
  const cameFrom = new Map<string, AquaPoint | null>([[cellKey(from), null]]);
  let frontier: AquaPoint[] = [from];

  for (let depth = 0; depth < BRIDGE_LIMIT; depth += 1) {
    const next: AquaPoint[] = [];
    for (const cell of frontier) {
      for (const [dx, dy] of STEPS) {
        const candidate = { x: cell.x + dx, y: cell.y + dy };
        const key = cellKey(candidate);
        if (cameFrom.has(key) || !isFree(candidate)) continue;
        cameFrom.set(key, cell);
        if (candidate.x === target.x && candidate.y === target.y) {
          const route: AquaPoint[] = [candidate];
          let walk: AquaPoint | null = cell;
          while (walk) {
            route.unshift(walk);
            walk = cameFrom.get(cellKey(walk)) ?? null;
          }
          return route;
        }
        next.push(candidate);
      }
    }
    frontier = next;
    if (frontier.length === 0) break;
  }

  return null;
}

export interface ExtendResult {
  path: AquaPoint[];
  /** True when the pointer tried to draw into an obstacle. */
  obstacle: boolean;
}

/**
 * Extends the drawn line towards `target`:
 * dragging back onto the previous cell undoes one step, obstacles are refused,
 * small gaps are bridged through free cells and used cells are never repeated.
 * Returns the previous array reference when nothing changed.
 */
export function extendPath(
  path: AquaPoint[],
  target: AquaPoint,
  isBlocked: (point: AquaPoint) => boolean,
): ExtendResult {
  if (path.length === 0) return { path, obstacle: false };
  const end = path[path.length - 1];
  if (samePoint(end, target)) return { path, obstacle: false };

  if (path.length >= 2 && samePoint(path[path.length - 2], target)) {
    return { path: path.slice(0, -1), obstacle: false };
  }
  if (isBlocked(target)) return { path, obstacle: true };

  const used = new Set(path.map(cellKey));
  if (used.has(cellKey(target))) return { path, obstacle: false };
  if (manhattan(end, target) === 1) return { path: [...path, target], obstacle: false };

  const bridge = findBridge(end, target, (point) => !isBlocked(point) && !used.has(cellKey(point)));
  if (bridge === null) return { path, obstacle: false };
  return { path: [...path, ...bridge.slice(1)], obstacle: false };
}

/** Where the water head sits after travelling `distance` units along the line. */
export function headPosition(path: AquaPoint[], distance: number): AquaPoint | null {
  const moves = path.length - 1;
  if (moves <= 0) return null;
  const clamped = Math.max(0, Math.min(moves, distance));
  const index = Math.min(moves - 1, Math.floor(clamped));
  const fraction = clamped - index;
  const from = path[index];
  const to = path[index + 1];
  return {
    x: from.x + 0.5 + (to.x - from.x) * fraction,
    y: from.y + 0.5 + (to.y - from.y) * fraction,
  };
}

/** How long the water takes to travel the whole line. */
export function flowDuration(pathCells: number): number {
  const moves = Math.max(0, pathCells - 1);
  return Math.min(1200, 280 + moves * 55);
}

/** Does the drawn line end on the glass? */
export function pathReachesGlass(path: AquaPoint[], glass: AquaPoint): boolean {
  if (path.length < 2) return false;
  return samePoint(path[path.length - 1], glass);
}
