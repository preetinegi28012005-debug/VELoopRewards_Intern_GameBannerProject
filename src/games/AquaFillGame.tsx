import { useCallback, useEffect, useRef, useState } from 'react';
import { GAME_DURATION } from '../config/constants';
import { getGameBySlug } from '../config/games';
import { usePlayableGame } from '../hooks/usePlayableGame';
import { GameShell } from './shared/GameShell';

const COLS = 8;
const ROWS = 7;

type CellType = 'empty' | 'wall' | 'source' | 'glass' | 'path';

interface BoardCell {
  type: CellType;
  filled: boolean;
}

interface Level {
  grid: BoardCell[][];
  source: { x: number; y: number };
  glass: { x: number; y: number };
}

const game = getGameBySlug('prism-drift')!;

function makeLevel(level: number): Level {
  const grid: BoardCell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ type: 'empty' as CellType, filled: false })),
  );

  const source = { x: 0, y: 3 };
  const glass = { x: COLS - 1, y: 3 };
  grid[source.y][source.x] = { type: 'source', filled: false };
  grid[glass.y][glass.x] = { type: 'glass', filled: false };

  const wallCount = Math.min(10, 3 + level * 2);
  let placed = 0;
  let guard = 0;
  while (placed < wallCount && guard < 200) {
    guard++;
    const x = Math.floor(Math.random() * COLS);
    const y = Math.floor(Math.random() * ROWS);
    if (
      (x === source.x && y === source.y) ||
      (x === glass.x && y === glass.y) ||
      grid[y][x].type === 'wall'
    )
      continue;
    if (Math.abs(x - source.x) <= 1 && y === source.y) continue;
    if (Math.abs(x - glass.x) <= 1 && y === glass.y) continue;
    grid[y][x] = { type: 'wall', filled: false };
    placed++;
  }

  return { grid, source, glass };
}

export function AquaFillGame() {
  const play = usePlayableGame(game, GAME_DURATION['prism-drift']);
  const [level, setLevel] = useState(0);
  const [board, setBoard] = useState<BoardCell[][]>(() => makeLevel(0).grid);
  const [path, setPath] = useState<{ x: number; y: number }[]>([]);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);
  const levelRef = useRef(0);
  const scoreRef = useRef(0);
  const hits = useRef(0);
  const misses = useRef(0);
  const currentLevel = useRef<Level | null>(null);

  const reset = useCallback(() => {
    const lv = makeLevel(0);
    currentLevel.current = lv;
    setBoard(lv.grid);
    setPath([{ x: lv.source.x, y: lv.source.y }]);
    setLevel(0);
    levelRef.current = 0;
    setScore(0);
    scoreRef.current = 0;
    setFlash(null);
    hits.current = 0;
    misses.current = 0;
  }, []);

  useEffect(() => {
    if (play.phase !== 'playing') return;
    reset();
  }, [play.session?.id, reset]);

  useEffect(() => {
    if (play.phase !== 'playing') return;
    if (play.timeLeft > 0) return;
    const total = hits.current + misses.current;
    play.finish({
      score: scoreRef.current,
      hits: hits.current,
      misses: misses.current,
      accuracy: total === 0 ? 0 : hits.current / total,
      endedBy: 'timeout',
    });
  }, [play, play.phase, play.timeLeft]);

  const nextLevel = useCallback(() => {
    const lv = makeLevel(levelRef.current + 1);
    currentLevel.current = lv;
    setBoard(lv.grid);
    setPath([{ x: lv.source.x, y: lv.source.y }]);
    levelRef.current += 1;
    setLevel(levelRef.current);
  }, []);

  const tapCell = (x: number, y: number) => {
    if (play.phase !== 'playing') return;
    const cell = board[y][x];
    if (cell.type === 'wall') {
      misses.current += 1;
      setFlash('bad');
      window.setTimeout(() => setFlash(null), 200);
      return;
    }

    const last = path[path.length - 1];
    const adjacent =
      (Math.abs(x - last.x) === 1 && y === last.y) ||
      (Math.abs(y - last.y) === 1 && x === last.x);

    if (!adjacent) {
      misses.current += 1;
      setFlash('bad');
      window.setTimeout(() => setFlash(null), 200);
      return;
    }

    const already = path.some((p) => p.x === x && p.y === y);
    if (already) return;

    const newPath = [...path, { x, y }];
    setPath(newPath);

    if (cell.type === 'glass') {
      hits.current += 1;
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFlash('good');
      window.setTimeout(() => setFlash(null), 300);
      window.setTimeout(() => nextLevel(), 400);
    }
  };

  return (
    <GameShell
      game={game}
      phase={play.phase}
      timeLeft={play.timeLeft}
      hud={
        <>
          <span>Level {level + 1}</span>
          <span>Glasses {score}</span>
        </>
      }
      error={play.error}
      onClearError={() => play.setError(null)}
      guideOpen={play.guideOpen}
      onOpenGuide={() => play.setGuideOpen(true)}
      onCloseGuide={() => play.setGuideOpen(false)}
      onStart={play.start}
      over={play.over}
      onPlayAgain={play.playAgain}
      onRevive={play.revive}
      onNoThanks={play.noThanks}
    >
      <div className={flash ? `aqua-board aqua-board--${flash}` : 'aqua-board'}>
        {play.phase !== 'playing' ? (
          <p className="board-hint">Start the round to draw a water path.</p>
        ) : (
          <div className="aqua-grid">
            {board.map((row, y) =>
              row.map((cell, x) => {
                const onPath = path.some((p) => p.x === x && p.y === y);
                let cls = 'aqua-cell';
                if (cell.type === 'wall') cls += ' aqua-cell--wall';
                else if (cell.type === 'source') cls += ' aqua-cell--source';
                else if (cell.type === 'glass') cls += ' aqua-cell--glass';
                else if (onPath) cls += ' aqua-cell--path';
                return (
                  <button
                    key={`${x}-${y}`}
                    type="button"
                    className={cls}
                    onClick={() => tapCell(x, y)}
                    disabled={play.phase !== 'playing'}
                    aria-label={`Cell ${x},${y}`}
                  />
                );
              }),
            )}
          </div>
        )}
      </div>
    </GameShell>
  );
}
