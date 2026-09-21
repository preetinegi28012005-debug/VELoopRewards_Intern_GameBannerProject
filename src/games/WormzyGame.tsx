import { useCallback, useEffect, useRef, useState } from 'react';
import { GAME_DURATION } from '../config/constants';
import { getGameBySlug } from '../config/games';
import { usePlayableGame } from '../hooks/usePlayableGame';
import { GameShell } from './shared/GameShell';

const GRID = 10;
const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
} as const;
type Dir = keyof typeof DIRS;

interface Cell {
  x: number;
  y: number;
}

const game = getGameBySlug('vault-breaker')!;

function randomApple(snake: Cell[]): Cell {
  const occupied = new Set(snake.map((c) => `${c.x},${c.y}`));
  const free: Cell[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { x: 0, y: 0 };
  return free[Math.floor(Math.random() * free.length)];
}

export function WormzyGame() {
  const play = usePlayableGame(game, GAME_DURATION['vault-breaker']);
  const [snake, setSnake] = useState<Cell[]>([
    { x: 4, y: 5 },
    { x: 3, y: 5 },
    { x: 2, y: 5 },
  ]);
  const [apple, setApple] = useState<Cell>({ x: 7, y: 5 });
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const dirRef = useRef<Dir>('right');
  const hits = useRef(0);
  const misses = useRef(0);
  const scoreRef = useRef(0);
  const snakeRef = useRef<Cell[]>(snake);
  const appleRef = useRef<Cell>(apple);

  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);
  useEffect(() => {
    appleRef.current = apple;
  }, [apple]);

  const reset = useCallback(() => {
    const s: Cell[] = [
      { x: 4, y: 5 },
      { x: 3, y: 5 },
      { x: 2, y: 5 },
    ];
    setSnake(s);
    snakeRef.current = s;
    const a = randomApple(s);
    setApple(a);
    appleRef.current = a;
    dirRef.current = 'right';
    setScore(0);
    scoreRef.current = 0;
    setDead(false);
    hits.current = 0;
    misses.current = 0;
  }, []);

  useEffect(() => {
    if (play.phase !== 'playing') return;
    reset();
  }, [play.session?.id, reset]);

  useEffect(() => {
    if (play.phase !== 'playing') return;
    const id = window.setInterval(() => {
      const d = DIRS[dirRef.current];
      const head = snakeRef.current[0];
      const nextHead = { x: head.x + d.x, y: head.y + d.y };

      if (
        nextHead.x < 0 ||
        nextHead.x >= GRID ||
        nextHead.y < 0 ||
        nextHead.y >= GRID ||
        snakeRef.current.some((c) => c.x === nextHead.x && c.y === nextHead.y)
      ) {
        misses.current += 1;
        setDead(true);
        return;
      }

      const ate = nextHead.x === appleRef.current.x && nextHead.y === appleRef.current.y;
      const newSnake = [nextHead, ...snakeRef.current];
      if (!ate) newSnake.pop();

      setSnake(newSnake);
      snakeRef.current = newSnake;

      if (ate) {
        hits.current += 1;
        scoreRef.current += 1;
        setScore(scoreRef.current);
        const a = randomApple(newSnake);
        setApple(a);
        appleRef.current = a;
      }
    }, 280);
    return () => window.clearInterval(id);
  }, [play.phase, play.session?.id, play.session?.reviveCount]);

  useEffect(() => {
    if (play.phase !== 'playing') return;
    if (play.timeLeft > 0 && !dead) return;
    const total = hits.current + misses.current;
    play.finish({
      score: scoreRef.current,
      hits: hits.current,
      misses: misses.current,
      accuracy: total === 0 ? 0 : hits.current / total,
      endedBy: dead ? 'complete' : 'timeout',
    });
  }, [play, play.phase, play.timeLeft, dead]);

  const turn = (next: Dir) => {
    if (play.phase !== 'playing') return;
    const cur = dirRef.current;
    if (
      (cur === 'left' && next === 'right') ||
      (cur === 'right' && next === 'left') ||
      (cur === 'up' && next === 'down') ||
      (cur === 'down' && next === 'up')
    )
      return;
    dirRef.current = next;
  };

  useEffect(() => {
    if (play.phase !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') turn('up');
      else if (e.key === 'ArrowDown') turn('down');
      else if (e.key === 'ArrowLeft') turn('left');
      else if (e.key === 'ArrowRight') turn('right');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [play.phase]);

  return (
    <GameShell
      game={game}
      phase={play.phase}
      timeLeft={play.timeLeft}
      hud={
        <>
          <span>Score {score}</span>
          <span>Length {snake.length}</span>
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
      <div className="wormzy-board" aria-label="Wormzy grid">
        {play.phase !== 'playing' ? (
          <p className="board-hint">Start the round to guide the worm.</p>
        ) : (
          <>
            <div className="wormzy-grid">
              {Array.from({ length: GRID * GRID }, (_, i) => {
                const x = i % GRID;
                const y = Math.floor(i / GRID);
                const isHead = snake[0].x === x && snake[0].y === y;
                const isBody = snake.some((c) => c.x === x && c.y === y);
                const isApple = apple.x === x && apple.y === y;
                return (
                  <div
                    key={i}
                    className={
                      isHead
                        ? 'wormzy-cell wormzy-cell--head'
                        : isBody
                          ? 'wormzy-cell wormzy-cell--body'
                          : isApple
                            ? 'wormzy-cell wormzy-cell--apple'
                            : 'wormzy-cell'
                    }
                  />
                );
              })}
            </div>
            <div className="wormzy-controls">
              <button type="button" onClick={() => turn('up')} aria-label="Move up">
                ▲
              </button>
              <div className="wormzy-controls__row">
                <button type="button" onClick={() => turn('left')} aria-label="Move left">
                  ◀
                </button>
                <button type="button" onClick={() => turn('down')} aria-label="Move down">
                  ▼
                </button>
                <button type="button" onClick={() => turn('right')} aria-label="Move right">
                  ▶
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </GameShell>
  );
}
