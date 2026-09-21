import { useCallback, useEffect, useRef, useState } from 'react';
import { ENTRY_COST, REVIVE_BONUS_SECONDS, REVIVE_COST } from '../config/constants';
import { useActionLock } from './useActionLock';
import { calculateGameCoins } from '../services/rewardCalculator';
import { completeSession, reviveSession, startGameSession } from '../services/gameSessionService';
import { hasSeenGuide, markGuideSeen } from '../services/settingsService';
import { InsufficientBalanceError } from '../services/walletService';
import type { GameConfig, GameSession } from '../types/models';

export interface FinishInput {
  score: number;
  accuracy: number;
  hits: number;
  misses: number;
  endedBy: 'timeout' | 'complete';
}

export interface OverState {
  score: number;
  label: string;
  coins: number;
  tokensSpent: number;
  reviveCount: number;
  accuracy: number;
  endedBy: 'timeout' | 'complete';
}

export function usePlayableGame(game: GameConfig, durationSeconds: number) {
  const { run } = useActionLock();
  const [phase, setPhase] = useState<'lobby' | 'playing' | 'over'>('lobby');
  const [session, setSession] = useState<GameSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [seenGuide, setSeenGuide] = useState(true);
  const [over, setOver] = useState<OverState | null>(null);
  const pending = useRef<FinishInput | null>(null);
  const settled = useRef(false);
  const finishing = useRef(false);

  useEffect(() => {
    void hasSeenGuide(game.id).then((seen) => {
      setSeenGuide(seen);
      if (!seen) setGuideOpen(true);
    });
  }, [game.id]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, session?.id, session?.reviveCount]);

  const begin = useCallback(
    async (existing?: GameSession) => {
      const next = existing ?? (await startGameSession(game.id));
      pending.current = null;
      settled.current = false;
      finishing.current = false;
      setSession(next);
      setTimeLeft(durationSeconds);
      setOver(null);
      setPhase('playing');
      await markGuideSeen(game.id);
      setSeenGuide(true);
      setGuideOpen(false);
      return next;
    },
    [durationSeconds, game.id],
  );

  const start = useCallback(() => {
    void run(async () => {
      setError(null);
      try {
        await begin();
      } catch (err) {
        if (err instanceof InsufficientBalanceError) setError(err.message);
        else setError('Could not start the game. Please try again.');
      }
    });
  }, [begin, run]);

  const finish = useCallback(
    (input: FinishInput) => {
      if (phase !== 'playing' || finishing.current) return;
      finishing.current = true;
      pending.current = input;
      const elapsed = Math.max(
        1,
        durationSeconds - timeLeft + (session?.reviveCount ?? 0) * REVIVE_BONUS_SECONDS,
      );
      const reward = calculateGameCoins({
        score: input.score,
        accuracy: input.accuracy,
        durationSeconds,
        elapsedSeconds: elapsed,
      });
      setOver({
        score: input.score,
        label: reward.label,
        coins: reward.coins,
        tokensSpent: session?.tokensSpent ?? ENTRY_COST,
        reviveCount: session?.reviveCount ?? 0,
        accuracy: input.accuracy,
        endedBy: input.endedBy,
      });
      setPhase('over');
    },
    [durationSeconds, phase, session, timeLeft],
  );

  const settle = useCallback(async () => {
    if (!session || settled.current || !pending.current) return session;
    const elapsed = Math.max(
      1,
      durationSeconds - timeLeft + session.reviveCount * REVIVE_BONUS_SECONDS,
    );
    const next = await completeSession(session.id, {
      score: pending.current.score,
      accuracy: pending.current.accuracy,
      durationSeconds,
      elapsedSeconds: elapsed,
    });
    settled.current = true;
    setSession(next);
    return next;
  }, [durationSeconds, session, timeLeft]);

  const noThanks = useCallback(() => {
    void run(async () => {
      await settle();
      setPhase('lobby');
      setSession(null);
      setOver(null);
    });
  }, [run, settle]);

  const playAgain = useCallback(() => {
    void run(async () => {
      await settle();
      try {
        await begin();
      } catch (err) {
        setPhase('lobby');
        setSession(null);
        if (err instanceof InsufficientBalanceError) setError(err.message);
      }
    });
  }, [begin, run, settle]);

  const revive = useCallback(() => {
    void run(async () => {
      if (!session) return;
      try {
        const next = await reviveSession(session.id);
        finishing.current = false;
        pending.current = null;
        setSession(next);
        setTimeLeft((value) => value + REVIVE_BONUS_SECONDS);
        setOver(null);
        setPhase('playing');
        setError(null);
      } catch (err) {
        if (err instanceof InsufficientBalanceError) setError(err.message);
        else setError('Revive is no longer available for this round.');
      }
    });
  }, [run, session]);

  return {
    phase,
    session,
    timeLeft,
    error,
    setError,
    guideOpen,
    setGuideOpen,
    seenGuide,
    over,
    start,
    finish,
    noThanks,
    playAgain,
    revive,
    reviveCost: REVIVE_COST,
    entryCost: ENTRY_COST,
  };
}
