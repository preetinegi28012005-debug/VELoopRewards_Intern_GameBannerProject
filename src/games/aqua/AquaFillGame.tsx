import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import aquaBanner from '../../assets/12.jpeg';
import { Modal } from '../../components/ui/Modal';
import { ENTRY_COST, GAME_DURATION } from '../../config/constants';
import { getGameBySlug } from '../../config/games';
import { useWallet } from '../../context/AppContext';
import { usePlayableGame } from '../../hooks/usePlayableGame';
import { abandonSession } from '../../services/gameSessionService';
import { grantArcadeReward } from '../../services/arcadeRewardService';
import { RewardDisplay } from '../shared/RewardDisplay';
import { Timer } from '../shared/Timer';
import type { ArcadeReward } from '../shared/rewards';
import { AquaBoard, type AquaGlassState } from './AquaBoard';
import { AquaPanel } from './AquaPanel';
import { AquaResultModal } from './AquaResultModal';
import { pathReachesGlass } from './drawing';
import {
  TOTAL_LEVELS,
  createLevel,
  fillForPath,
  timeLimitForLevel,
  type AquaLevel,
  type AquaPoint,
} from './levels';
import { AQUA_REWARD_TIERS, rewardForCompletedLevels } from './rewards';

const game = getGameBySlug('prism-drift')!;

type AquaStatus = 'idle' | 'drawing' | 'flowing' | 'cleared' | 'over';
type AquaOutcome = 'timeout' | 'victory';
type Banner = { id: number; text: string; tone: 'good' | 'bad' };

/**
 * Aqua Fill — guide water from the pipe into the glass by drawing a line.
 * 20 levels, 10 seconds each (15 seconds from level 11), obstacles to route
 * around, and a reward based on the highest level actually completed.
 */
export function AquaFillGame() {
  const play = usePlayableGame(game, GAME_DURATION['prism-drift']);
  const wallet = useWallet();
  const navigate = useNavigate();

  const [level, setLevel] = useState<AquaLevel>(() => createLevel(0));
  const [levelIndex, setLevelIndex] = useState(0);
  const [path, setPath] = useState<AquaPoint[]>([]);
  const [status, setStatus] = useState<AquaStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(() => timeLimitForLevel(0));
  const [fill, setFill] = useState(0);
  const [glassState, setGlassState] = useState<AquaGlassState>('idle');
  const [flowing, setFlowing] = useState(false);
  const [flowKey, setFlowKey] = useState(0);
  const [blockedCell, setBlockedCell] = useState<AquaPoint | null>(null);
  const [leakPoint, setLeakPoint] = useState<AquaPoint | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [highestCompleted, setHighestCompleted] = useState(0);
  const [outcome, setOutcome] = useState<AquaOutcome | null>(null);
  const [reward, setReward] = useState<ArcadeReward | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  const pathRef = useRef<AquaPoint[]>([]);
  const completedRef = useRef(0);
  const playedRef = useRef(0);
  const endedRef = useRef(false);
  const startedSessionRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const transitionRef = useRef<number | null>(null);
  const feedbackRef = useRef<number | null>(null);
  const bannerIdRef = useRef(0);
  const endRunRef = useRef<(result: AquaOutcome) => void>(() => undefined);
  const flowCompleteRef = useRef<() => void>(() => undefined);

  const drawing = play.phase === 'playing' && status === 'drawing';
  const isGameCompleted = outcome === 'victory';
  const canAfford = wallet.tokens >= ENTRY_COST;
  const timeLimit = timeLimitForLevel(levelIndex);
  const target = Math.round(level.targetFill * 100);
  const projected = fillForPath(level, path.length);

  const flashBanner = (text: string, tone: 'good' | 'bad') => {
    bannerIdRef.current += 1;
    setBanner({ id: bannerIdRef.current, text, tone });
  };

  const clearDeferred = () => {
    if (transitionRef.current !== null) {
      window.clearTimeout(transitionRef.current);
      transitionRef.current = null;
    }
    if (feedbackRef.current !== null) {
      window.clearTimeout(feedbackRef.current);
      feedbackRef.current = null;
    }
  };

  const loadLevel = (index: number) => {
    const next = createLevel(index);
    setLevelIndex(index);
    setLevel(next);
    pathRef.current = [];
    setPath([]);
    setTimeLeft(timeLimitForLevel(index));
    setFill(0);
    setGlassState('idle');
    setFlowing(false);
    setBlockedCell(null);
    setLeakPoint(null);
    setStatus('drawing');
    playedRef.current += 1;
  };

  const endRun = (result: AquaOutcome) => {
    if (endedRef.current || play.phase !== 'playing') return;
    endedRef.current = true;
    clearDeferred();

    const completed = completedRef.current;
    const played = Math.max(1, playedRef.current);
    const victory = result === 'victory';
    const earned = rewardForCompletedLevels(completed);

    setStatus('over');
    setFlowing(false);
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

  /** The water reached the glass: fill it and judge the level. */
  const handleFlowComplete = () => {
    if (endedRef.current) return;
    const currentPath = pathRef.current;
    const reached = fillForPath(level, currentPath.length);
    setFill(reached);

    if (reached + 0.0001 >= level.targetFill) {
      const completed = levelIndex + 1;
      completedRef.current = completed;
      setHighestCompleted(completed);
      setGlassState('success');
      setStatus('cleared');
      flashBanner(`Level ${completed} complete ✓`, 'good');

      if (completed >= TOTAL_LEVELS) {
        endRun('victory');
        return;
      }
      transitionRef.current = window.setTimeout(() => {
        transitionRef.current = null;
        loadLevel(completed);
      }, 1100);
      return;
    }

    setGlassState('fail');
    flashBanner(
      `Filled ${Math.round(reached * 100)}% — this glass needs ${Math.round(level.targetFill * 100)}%`,
      'bad',
    );
    transitionRef.current = window.setTimeout(() => {
      transitionRef.current = null;
      setFill(0);
      setGlassState('idle');
      setFlowing(false);
      setStatus('drawing');
    }, 1100);
  };

  const handlePathChange = (next: AquaPoint[]) => {
    if (status !== 'drawing' || endedRef.current) return;
    pathRef.current = next;
    setPath(next);
    // Editing the line clears the previous attempt's water.
    if (flowing || fill !== 0 || glassState !== 'idle') {
      setFill(0);
      setGlassState('idle');
      setFlowing(false);
    }
  };

  const handlePathRelease = (released: AquaPoint[]) => {
    if (status !== 'drawing' || endedRef.current) return;
    if (released.length < 2) return;

    if (!pathReachesGlass(released, level.glass)) {
      setLeakPoint(released[released.length - 1]);
      if (banner?.text !== 'Your line stops short of the glass') {
        flashBanner('Your line stops short of the glass', 'bad');
      }
      if (feedbackRef.current !== null) window.clearTimeout(feedbackRef.current);
      feedbackRef.current = window.setTimeout(() => {
        feedbackRef.current = null;
        setLeakPoint(null);
      }, 520);
      return;
    }

    setStatus('flowing');
    setFlowing(true);
    setFlowKey((value) => value + 1);
  };

  const handleObstacleBump = (point: AquaPoint) => {
    setBlockedCell(point);
    if (banner?.text !== 'Water cannot pass through that') {
      flashBanner('Water cannot pass through that', 'bad');
    }
    if (feedbackRef.current !== null) window.clearTimeout(feedbackRef.current);
    feedbackRef.current = window.setTimeout(() => {
      feedbackRef.current = null;
      setBlockedCell(null);
    }, 340);
  };

  const handleStartRejected = () => {
    if (banner?.text !== 'Start your line on the pipe') {
      flashBanner('Start your line on the pipe', 'bad');
    }
  };

  /** Reset path keeps the same level and the remaining time. */
  const resetPath = () => {
    if (status !== 'drawing' || endedRef.current) return;
    pathRef.current = [];
    setPath([]);
    setFill(0);
    setGlassState('idle');
    setFlowing(false);
    setLeakPoint(null);
  };

  const restartRun = () => {
    setResultOpen(false);
    play.playAgain();
  };

  const backToHub = () => {
    if (play.phase === 'over') play.noThanks();
    navigate('/games');
  };

  useEffect(() => {
    endRunRef.current = endRun;
    flowCompleteRef.current = handleFlowComplete;
  });

  // A new session means a brand new run: level 1, fresh timer, empty path.
  useEffect(() => {
    const sessionId = play.session?.id;
    if (play.phase !== 'playing' || !sessionId) return;
    if (startedSessionRef.current === sessionId) return;
    startedSessionRef.current = sessionId;
    endedRef.current = false;
    completedRef.current = 0;
    playedRef.current = 0;
    clearDeferred();
    setHighestCompleted(0);
    setOutcome(null);
    setReward(null);
    setResultOpen(false);
    setBanner(null);
    loadLevel(0);
  }, [play.phase, play.session?.id]);

  // One countdown per level, only while the player is actually drawing.
  useEffect(() => {
    if (play.phase !== 'playing' || status !== 'drawing') return;
    const id = window.setInterval(() => {
      setTimeLeft((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [play.phase, status, levelIndex, play.session?.id]);

  // Timer reached zero: the run ends immediately and cannot continue.
  useEffect(() => {
    if (play.phase !== 'playing' || status !== 'drawing' || timeLeft > 0) return;
    endRunRef.current('timeout');
  }, [play.phase, status, timeLeft]);

  useEffect(() => {
    if (!banner) return;
    const id = window.setTimeout(() => setBanner(null), 1200);
    return () => window.clearTimeout(id);
  }, [banner]);

  useEffect(() => {
    sessionIdRef.current = play.session?.id ?? null;
  }, [play.session?.id]);

  // Unmount: clear pending timers and close an unfinished session.
  useEffect(
    () => () => {
      clearDeferred();
      const sessionId = sessionIdRef.current;
      if (sessionId) void abandonSession(sessionId).catch(() => undefined);
    },
    [],
  );

  const boardStateClass =
    status === 'cleared'
      ? 'aqua-board-wrap aqua-board-wrap--clear'
      : status === 'over'
        ? 'aqua-board-wrap aqua-board-wrap--over'
        : 'aqua-board-wrap';

  return (
    <div className="game-env aqua" style={{ ['--game-accent' as string]: game.accent }}>
      <div className="aqua-topbar">
        <Link className="aqua-back" to="/games">
          ← Back to V Loop
        </Link>
        <span className="aqua-topbar__meta">
          Level {levelIndex + 1} of {TOTAL_LEVELS} · {timeLimit}s per level
        </span>
      </div>

      <section className="aqua-hero">
        <div className="aqua-hero__art">
          <img className="aqua-hero__image" src={aquaBanner} alt="Aqua Fill key art" />
        </div>
        <div className="aqua-hero__copy">
          <p className="eyebrow">VELOOP Arcade</p>
          <h1>{game.name}</h1>
          <p className="aqua-hero__tagline">{game.tagline}</p>
          <p className="lead">{game.description}</p>
          <div className="aqua-stats">
            <div className="aqua-stat">
              <small>Current level</small>
              <strong>
                {levelIndex + 1} / {TOTAL_LEVELS}
              </strong>
            </div>
            <div className="aqua-stat">
              <small>Level timer</small>
              <strong>{timeLeft}s</strong>
            </div>
            <div className="aqua-stat">
              <small>Glass target</small>
              <strong>{target}%</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="playfield-wrap">
        <div className="aqua-hud">
          <RewardDisplay
            activeRewardId={rewardForCompletedLevels(highestCompleted).id}
            tiers={AQUA_REWARD_TIERS}
            prefix="aqua"
          />
          <div className="aqua-hud__stats">
            <span className="aqua-chip">
              Level <strong>{levelIndex + 1}</strong> / {TOTAL_LEVELS}
            </span>
            <Timer seconds={timeLeft} totalSeconds={timeLimit} live={drawing} prefix="aqua" />
            <span className="aqua-chip">
              Cleared <strong>{highestCompleted}</strong>
            </span>
          </div>
        </div>

        <div className="aqua-stage">
          <div className={boardStateClass}>
            <AquaBoard
              level={level}
              path={path}
              fill={fill}
              flowing={flowing}
              flowKey={flowKey}
              glassState={glassState}
              blockedCell={blockedCell}
              leakPoint={leakPoint}
              interactive={drawing}
              onPathChange={handlePathChange}
              onPathRelease={handlePathRelease}
              onObstacleBump={handleObstacleBump}
              onStartRejected={handleStartRejected}
              onFlowComplete={() => flowCompleteRef.current()}
            />

            {banner ? (
              <p key={banner.id} className={`aqua-banner aqua-banner--${banner.tone}`}>
                {banner.text}
              </p>
            ) : null}

            {play.phase === 'playing' ? null : (
              <div className="aqua-overlay">
                <p className="aqua-overlay__title">
                  {play.phase === 'over' ? 'Run finished' : 'Draw the water home'}
                </p>
                <p className="aqua-overlay__text">
                  {TOTAL_LEVELS} levels · {timeLimit}s per level. Press on the pipe, drag a line to
                  the glass and dodge every obstacle.
                </p>
                <div className="aqua-overlay__actions">
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
                  <p className="warn">You need {ENTRY_COST} Tokens to enter Aqua Fill.</p>
                ) : null}
              </div>
            )}
          </div>

          <AquaPanel
            level={level}
            pathCells={path.length}
            projectedFill={projected}
            canReset={path.length > 0}
            disabled={!drawing}
            onReset={resetPath}
          />
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

      <AquaResultModal
        open={resultOpen}
        victory={isGameCompleted}
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
