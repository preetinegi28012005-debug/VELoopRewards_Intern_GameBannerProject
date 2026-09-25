import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import wormzyBanner from '../../assets/11.jpeg';
import { Modal } from '../../components/ui/Modal';
import { ENTRY_COST, GAME_DURATION } from '../../config/constants';
import { getGameBySlug } from '../../config/games';
import { useWallet } from '../../context/AppContext';
import { usePlayableGame } from '../../hooks/usePlayableGame';
import { abandonSession } from '../../services/gameSessionService';
import { grantArcadeReward } from '../../services/arcadeRewardService';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { GameHUD } from './GameHUD';
import { ResultModal } from './ResultModal';
import {
  LEVEL_SECONDS,
  TOTAL_LEVELS,
  WORMZY_DIRECTIONS,
  createLevel,
  type WormzyDirection,
  type WormzyLevel,
  type WormzyPoint,
} from './levels';
import { rewardForCompletedLevels, type WormzyReward } from './rewards';

const game = getGameBySlug('vault-breaker')!;

type RunStatus = 'idle' | 'running' | 'cleared' | 'over';
type RunOutcome = 'bomb' | 'timeout' | 'victory';
type Banner = { id: number; text: string; tone: 'good' | 'bad' };

export function WormzyGame() {
  const play = usePlayableGame(game, GAME_DURATION['vault-breaker']);
  const wallet = useWallet();
  const navigate = useNavigate();

  const [level, setLevel] = useState<WormzyLevel>(() => createLevel(0));
  const [levelIndex, setLevelIndex] = useState(0);
  const [worm, setWorm] = useState<WormzyPoint>(() => level.start);
  const [status, setStatus] = useState<RunStatus>('idle');
  const [levelTime, setLevelTime] = useState(LEVEL_SECONDS);
  const [highestCompleted, setHighestCompleted] = useState(0);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [reward, setReward] = useState<WormzyReward | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [blockedCell, setBlockedCell] = useState<WormzyPoint | null>(null);
  const [blastCell, setBlastCell] = useState<WormzyPoint | null>(null);
  const [stepKey, setStepKey] = useState(0);

  const wormRef = useRef<WormzyPoint>(worm);
  const completedRef = useRef(0);
  const playedRef = useRef(0);
  const endedRef = useRef(false);
  const startedSessionRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const transitionRef = useRef<number | null>(null);
  const bannerIdRef = useRef(0);
  const moveRef = useRef<(direction: WormzyDirection) => boolean>(() => false);
  const endRunRef = useRef<(result: RunOutcome) => void>(() => undefined);

  const live = play.phase === 'playing' && status === 'running';
  const isGameCompleted = outcome === 'victory';
  const canAfford = wallet.tokens >= ENTRY_COST;

  const flashBanner = (text: string, tone: 'good' | 'bad') => {
    bannerIdRef.current += 1;
    setBanner({ id: bannerIdRef.current, text, tone });
  };

  const clearTransition = () => {
    if (transitionRef.current !== null) {
      window.clearTimeout(transitionRef.current);
      transitionRef.current = null;
    }
  };

  const loadLevel = (index: number) => {
    const nextLevel = createLevel(index);
    setLevelIndex(index);
    setLevel(nextLevel);
    setWorm(nextLevel.start);
    wormRef.current = nextLevel.start;
    setLevelTime(LEVEL_SECONDS);
    setBlockedCell(null);
    setBlastCell(null);
    setStepKey((value) => value + 1);
    playedRef.current += 1;
  };

  const endRun = (result: RunOutcome) => {
    if (endedRef.current || play.phase !== 'playing') return;
    endedRef.current = true;
    clearTransition();

    const completed = completedRef.current;
    const played = Math.max(1, playedRef.current);
    const victory = result === 'victory';
    const earned = rewardForCompletedLevels(completed);

    setStatus('over');
    setOutcome(result);
    setReward(earned);
    setResultOpen(true);
    if (!victory) setBanner(null);
    void grantArcadeReward(earned).catch(() => undefined);

    play.finish({
      score: completed,
      hits: completed,
      misses: Math.max(0, played - completed),
      accuracy: Math.min(1, completed / played),
      endedBy: victory ? 'complete' : 'timeout',
    });
  };

  const completeLevel = () => {
    if (endedRef.current) return;
    const completed = levelIndex + 1;
    completedRef.current = completed;
    setHighestCompleted(completed);

    if (completed >= TOTAL_LEVELS) {
      endRun('victory');
      return;
    }

    setStatus('cleared');
    flashBanner(`Level ${completed} cleared!`, 'good');
    const nextIndex = completed;
    transitionRef.current = window.setTimeout(() => {
      transitionRef.current = null;
      loadLevel(nextIndex);
      setStatus('running');
    }, 700);
  };

  const move = (direction: WormzyDirection): boolean => {
    if (endedRef.current || play.phase !== 'playing' || status !== 'running') return false;

    const step = WORMZY_DIRECTIONS[direction];
    const from = wormRef.current;
    const next = { x: from.x + step.x, y: from.y + step.y };

    if (next.x < 0 || next.y < 0 || next.x >= level.size || next.y >= level.size) {
      setBlockedCell(from);
      flashBanner('Wormzy cannot leave the board', 'bad');
      return true;
    }

    const tile = level.tiles[next.y][next.x];
    if (tile === 'stone') {
      setBlockedCell(next);
      flashBanner('A stone blocks that path', 'bad');
      return true;
    }

    if (tile === 'bomb') {
      setWorm(next);
      wormRef.current = next;
      setBlastCell(next);
      setStepKey((value) => value + 1);
      endRun('bomb');
      return true;
    }

    setWorm(next);
    wormRef.current = next;
    setStepKey((value) => value + 1);
    if (next.x === level.goal.x && next.y === level.goal.y) completeLevel();
    return true;
  };

  const tapCell = (x: number, y: number) => {
    if (play.phase !== 'playing' || status !== 'running') return;
    const from = wormRef.current;
    const dx = x - from.x;
    const dy = y - from.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) {
      flashBanner('Tap a cell next to Wormzy', 'bad');
      return;
    }
    if (dx === 1) move('right');
    else if (dx === -1) move('left');
    else if (dy === 1) move('down');
    else move('up');
  };

  const restartRun = () => {
    setResultOpen(false);
    play.playAgain();
  };

  const backToHub = () => {
    if (play.phase === 'over') play.noThanks();
    navigate('/games');
  };

  // Keep the keyboard / timer callbacks pointing at the newest render.
  useEffect(() => {
    moveRef.current = move;
    endRunRef.current = endRun;
  });

  // A new session means a brand new run: level 1, 10 seconds, clean board.
  useEffect(() => {
    const sessionId = play.session?.id;
    if (play.phase !== 'playing' || !sessionId) return;
    if (startedSessionRef.current === sessionId) return;
    startedSessionRef.current = sessionId;
    endedRef.current = false;
    completedRef.current = 0;
    playedRef.current = 0;
    clearTransition();
    setHighestCompleted(0);
    setOutcome(null);
    setReward(null);
    setResultOpen(false);
    setBanner(null);
    loadLevel(0);
    setStatus('running');
  }, [play.phase, play.session?.id]);

  // One interval per level; cleaned up whenever the level or the status changes.
  useEffect(() => {
    if (play.phase !== 'playing' || status !== 'running') return;
    const id = window.setInterval(() => {
      setLevelTime((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [play.phase, status, levelIndex, play.session?.id]);

  // Timer reached zero: the run ends immediately and cannot continue.
  useEffect(() => {
    if (play.phase !== 'playing' || status !== 'running' || levelTime > 0) return;
    endRunRef.current('timeout');
  }, [play.phase, status, levelTime]);

  useEffect(() => {
    if (!banner) return;
    const id = window.setTimeout(() => setBanner(null), 1100);
    return () => window.clearTimeout(id);
  }, [banner]);

  useEffect(() => {
    if (!blockedCell) return;
    const id = window.setTimeout(() => setBlockedCell(null), 320);
    return () => window.clearTimeout(id);
  }, [blockedCell]);

  // A single keyboard listener for the whole screen: arrow keys and WASD.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      let direction: WormzyDirection | null = null;
      if (key === 'ArrowUp' || key === 'w' || key === 'W') direction = 'up';
      else if (key === 'ArrowDown' || key === 's' || key === 'S') direction = 'down';
      else if (key === 'ArrowLeft' || key === 'a' || key === 'A') direction = 'left';
      else if (key === 'ArrowRight' || key === 'd' || key === 'D') direction = 'right';
      if (!direction) return;

      const tag = (event.target as HTMLElement | null)?.tagName ?? '';
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (moveRef.current(direction)) event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    sessionIdRef.current = play.session?.id ?? null;
  }, [play.session?.id]);

  // Unmount: clear pending timers and close an unfinished session as "left early".
  useEffect(
    () => () => {
      clearTransition();
      const sessionId = sessionIdRef.current;
      if (sessionId) void abandonSession(sessionId).catch(() => undefined);
    },
    [],
  );

  const boardStateClass =
    status === 'cleared'
      ? 'wormzy-board-wrap wormzy-board-wrap--clear'
      : status === 'over'
        ? 'wormzy-board-wrap wormzy-board-wrap--over'
        : 'wormzy-board-wrap';

  return (
    <div className="game-env wormzy" style={{ ['--game-accent' as string]: game.accent }}>
      <div className="wormzy-topbar">
        <Link className="wormzy-back" to="/games">
          ← Back to V Loop
        </Link>
        <span className="wormzy-topbar__meta">
          Level {levelIndex + 1} of {TOTAL_LEVELS} · {LEVEL_SECONDS}s per level
        </span>
      </div>

      <section className="wormzy-hero">
        <div className="wormzy-hero__art">
          <img className="wormzy-hero__image" src={wormzyBanner} alt="Wormzy key art" />
        </div>
        <div className="wormzy-hero__copy">
          <p className="eyebrow">VELOOP Arcade</p>
          <h1>{game.name}</h1>
          <p className="lead">{game.description}</p>
          <div className="wormzy-stats">
            <div className="wormzy-stat">
              <small>Current level</small>
              <strong>
                {levelIndex + 1} / {TOTAL_LEVELS}
              </strong>
            </div>
            <div className="wormzy-stat">
              <small>Level timer</small>
              <strong>{levelTime}s</strong>
            </div>
            <div className="wormzy-stat">
              <small>Levels cleared</small>
              <strong>{highestCompleted}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="playfield-wrap">
        <GameHUD
          levelNumber={levelIndex + 1}
          totalLevels={TOTAL_LEVELS}
          seconds={levelTime}
          totalSeconds={LEVEL_SECONDS}
          highestCompleted={highestCompleted}
          live={live}
        />

        <div className="wormzy-stage">
          <div className={boardStateClass}>
            <GameBoard
              level={level}
              worm={worm}
              stepKey={stepKey}
              blockedCell={blockedCell}
              blastCell={blastCell}
              interactive={live}
              onCellSelect={tapCell}
            >
              {banner ? (
                <p key={banner.id} className={`wormzy-banner wormzy-banner--${banner.tone}`}>
                  {banner.text}
                </p>
              ) : null}

              {play.phase === 'playing' ? null : (
                <div className="wormzy-overlay">
                  <p className="wormzy-overlay__title">
                    {play.phase === 'over' ? 'Run finished' : 'Guide Wormzy to the goal'}
                  </p>
                  <p className="wormzy-overlay__text">
                    {TOTAL_LEVELS} levels · {LEVEL_SECONDS} seconds each. Dodge the stones and never
                    touch a bomb.
                  </p>
                  <div className="wormzy-overlay__actions">
                    {play.phase === 'over' ? (
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={restartRun}
                        disabled={!canAfford}
                      >
                        Play again · {ENTRY_COST} Tokens
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => play.start()}
                        disabled={!canAfford}
                      >
                        Start run · {ENTRY_COST} Tokens
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => play.setGuideOpen(true)}
                    >
                      How to play
                    </button>
                    <Link className="btn btn--ghost" to="/games">
                      Back to V Loop
                    </Link>
                  </div>
                  {!canAfford ? (
                    <p className="warn">You need {ENTRY_COST} Tokens to enter Wormzy.</p>
                  ) : null}
                </div>
              )}
            </GameBoard>
          </div>

          <GameControls onMove={move} disabled={!live} />
        </div>
      </section>

      <Modal
        open={play.guideOpen}
        title={`${game.name} guide`}
        onClose={() => play.setGuideOpen(false)}
        footer={
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => play.setGuideOpen(false)}
          >
            Got it
          </button>
        }
      >
        <ol className="guide-list">
          {game.guide.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </Modal>

      <Modal
        open={Boolean(play.error)}
        title="Not enough Tokens"
        onClose={() => play.setError(null)}
        footer={
          <button type="button" className="btn btn--primary" onClick={() => play.setError(null)}>
            Okay
          </button>
        }
      >
        <p>{play.error}</p>
      </Modal>

      <ResultModal
        open={resultOpen}
        victory={isGameCompleted}
        reason={outcome === 'bomb' || outcome === 'timeout' ? outcome : null}
        highestCompleted={highestCompleted}
        reward={reward}
        coinsEarned={play.over?.coins ?? 0}
        canRestart={canAfford}
        onRestart={restartRun}
        onBack={backToHub}
        onDismiss={() => setResultOpen(false)}
      />
    </div>
  );
}
