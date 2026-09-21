import { ENTRY_COST, REVIVE_COST } from '../config/constants';
import { getGameBySlug } from '../config/games';
import { db } from '../db/database';
import { emitAppData } from '../lib/events';
import { createId } from '../lib/ids';
import { withLock } from '../lib/mutex';
import type { GameSession, GameStat } from '../types/models';
import { calculateGameCoins } from './rewardCalculator';
import { InsufficientBalanceError } from './walletService';

async function requireGame(gameId: string) {
  const game = getGameBySlug(gameId);
  if (!game || game.status !== 'playable') {
    throw new Error('This game is not available');
  }
  return game;
}

async function bumpStats(
  gameId: string,
  patch: Partial<GameStat> & { score?: number; coins?: number; tokens?: number; revives?: number },
): Promise<void> {
  const current =
    (await db.stats.get(gameId)) ??
    ({
      gameId,
      plays: 0,
      highScore: 0,
      totalCoins: 0,
      totalTokens: 0,
      totalRevives: 0,
      lastPlayedAt: Date.now(),
    } satisfies GameStat);

  const next: GameStat = {
    ...current,
    plays: current.plays + (patch.plays ?? 0),
    highScore: Math.max(current.highScore, patch.score ?? 0, patch.highScore ?? 0),
    totalCoins: current.totalCoins + (patch.coins ?? 0),
    totalTokens: current.totalTokens + (patch.tokens ?? 0),
    totalRevives: current.totalRevives + (patch.revives ?? 0),
    lastPlayedAt: Date.now(),
  };
  await db.stats.put(next);
}

export async function startGameSession(gameId: string): Promise<GameSession> {
  const game = await requireGame(gameId);
  return withLock(async () => {
    return db.transaction('rw', db.wallet, db.sessions, db.stats, async () => {
      const wallet = await db.wallet.get('primary');
      if (!wallet) throw new Error('Wallet is not initialized');
      if (wallet.tokens < ENTRY_COST) {
        throw new InsufficientBalanceError('Not enough Tokens to start this game.');
      }
      wallet.tokens -= ENTRY_COST;
      wallet.updatedAt = Date.now();
      await db.wallet.put(wallet);

      const session: GameSession = {
        id: createId('session'),
        gameId: game.id,
        gameName: game.name,
        score: 0,
        result: 'In progress',
        gameCoinsEarned: 0,
        tokensSpent: ENTRY_COST,
        reviveCount: 0,
        rewarded: false,
        status: 'playing',
        startedAt: Date.now(),
        endedAt: null,
      };
      await db.sessions.add(session);
      await bumpStats(game.id, { plays: 1, tokens: ENTRY_COST });
      emitAppData();
      return session;
    });
  });
}

export async function reviveSession(sessionId: string): Promise<GameSession> {
  return withLock(async () => {
    return db.transaction('rw', db.wallet, db.sessions, db.stats, async () => {
      const session = await db.sessions.get(sessionId);
      if (!session || session.status !== 'playing' || session.rewarded) {
        throw new Error('This round can no longer be revived.');
      }
      const wallet = await db.wallet.get('primary');
      if (!wallet) throw new Error('Wallet is not initialized');
      if (wallet.tokens < REVIVE_COST) {
        throw new InsufficientBalanceError('Not enough Tokens to revive.');
      }
      wallet.tokens -= REVIVE_COST;
      wallet.updatedAt = Date.now();
      session.tokensSpent += REVIVE_COST;
      session.reviveCount += 1;
      await db.wallet.put(wallet);
      await db.sessions.put(session);
      await bumpStats(session.gameId, { tokens: REVIVE_COST, revives: 1 });
      emitAppData();
      return session;
    });
  });
}

export async function completeSession(
  sessionId: string,
  input: {
    score: number;
    accuracy: number;
    durationSeconds: number;
    elapsedSeconds: number;
  },
): Promise<GameSession> {
  return withLock(async () => {
    return db.transaction('rw', db.wallet, db.sessions, db.stats, async () => {
      const session = await db.sessions.get(sessionId);
      if (!session) throw new Error('Session not found');
      if (session.rewarded) return session;

      const reward = calculateGameCoins(input);
      const wallet = await db.wallet.get('primary');
      if (!wallet) throw new Error('Wallet is not initialized');

      wallet.gameCoins += reward.coins;
      wallet.updatedAt = Date.now();
      session.score = input.score;
      session.result = reward.label;
      session.gameCoinsEarned = reward.coins;
      session.rewarded = true;
      session.status = 'completed';
      session.endedAt = Date.now();

      await db.wallet.put(wallet);
      await db.sessions.put(session);
      await bumpStats(session.gameId, { score: input.score, coins: reward.coins });
      emitAppData();
      return session;
    });
  });
}

export async function abandonSession(sessionId: string): Promise<void> {
  await withLock(async () => {
    const session = await db.sessions.get(sessionId);
    if (!session || session.rewarded || session.status !== 'playing') return;
    session.status = 'abandoned';
    session.result = 'Left early';
    session.endedAt = Date.now();
    await db.sessions.put(session);
    emitAppData();
  });
}

export async function listSessions(): Promise<GameSession[]> {
  return db.sessions.orderBy('startedAt').reverse().toArray();
}

export async function listStats(): Promise<GameStat[]> {
  return db.stats.toArray();
}
