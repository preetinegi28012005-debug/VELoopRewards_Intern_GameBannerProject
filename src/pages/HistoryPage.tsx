import { useEffect, useMemo, useState } from 'react';
import historyAvatar from '../assets/gamesHistory.png';
import { listSessions } from '../services/gameSessionService';
import { formatDateTime, formatNumber } from '../lib/format';
import { onAppData } from '../lib/events';
import type { GameSession } from '../types/models';
import { GAMES } from '../config/games';

export function HistoryPage() {
  const [rows, setRows] = useState<GameSession[]>([]);
  const [gameFilter, setGameFilter] = useState('all');
  const [sort, setSort] = useState<'newest' | 'score' | 'coins'>('newest');

  useEffect(() => {
    const load = () => {
      void listSessions().then(setRows);
    };
    load();
    return onAppData(load);
  }, []);

  const completed = rows.filter((row) => row.status === 'completed');
  const stats = useMemo(() => {
    const totalCoins = completed.reduce((sum, row) => sum + row.gameCoinsEarned, 0);
    const totalTokens = rows.reduce((sum, row) => sum + row.tokensSpent, 0);
    const totalRevives = rows.reduce((sum, row) => sum + row.reviveCount, 0);
    const highest = completed.reduce((max, row) => Math.max(max, row.score), 0);
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.gameName, (counts.get(row.gameName) ?? 0) + 1);
    const mostPlayed = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    return {
      played: rows.length,
      totalCoins,
      totalTokens,
      totalRevives,
      highest,
      mostPlayed,
    };
  }, [completed, rows]);

  const visible = useMemo(() => {
    let list = [...rows];
    if (gameFilter !== 'all') list = list.filter((row) => row.gameId === gameFilter);
    if (sort === 'score') list.sort((a, b) => b.score - a.score);
    if (sort === 'coins') list.sort((a, b) => b.gameCoinsEarned - a.gameCoinsEarned);
    return list;
  }, [gameFilter, rows, sort]);

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Local archive</p>
        <h1>Game History</h1>
        <p className="lead">Every round you start is stored in IndexedDB on this browser.</p>
      </header>

      <div className="history-hero-card">
        <div className="history-hero-card__art">
          <img className="history-hero-card__image" src={historyAvatar} alt="Gamer robot avatar" />
        </div>
        <div className="history-hero-card__content">
          <p className="eyebrow">Progress tracker</p>
          <h2>Your gaming journey</h2>
          <p>Track scores, rewards, revives and momentum across each live challenge.</p>
        </div>
      </div>

      <section className="stat-grid">
        <article>
          <small>Games played</small>
          <strong>{stats.played}</strong>
        </article>
        <article>
          <small>Game Coins earned</small>
          <strong>{formatNumber(stats.totalCoins)}</strong>
        </article>
        <article>
          <small>Highest score</small>
          <strong>{formatNumber(stats.highest)}</strong>
        </article>
        <article>
          <small>Most played</small>
          <strong>{stats.mostPlayed}</strong>
        </article>
        <article>
          <small>Tokens spent</small>
          <strong>{formatNumber(stats.totalTokens)}</strong>
        </article>
        <article>
          <small>Revives</small>
          <strong>{formatNumber(stats.totalRevives)}</strong>
        </article>
      </section>

      <div className="toolbar">
        <label>
          Game
          <select value={gameFilter} onChange={(e) => setGameFilter(e.target.value)}>
            <option value="all">All games</option>
            {GAMES.filter((g) => g.status === 'playable').map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="newest">Newest first</option>
            <option value="score">Highest score</option>
            <option value="coins">Most coins</option>
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="empty">No rounds yet. Play a game to write your first record.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Game</th>
                <th>Score</th>
                <th>Result</th>
                <th>Coins</th>
                <th>Tokens</th>
                <th>Revives</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id}>
                  <td>{row.gameName}</td>
                  <td>{row.score}</td>
                  <td>{row.result}</td>
                  <td>{row.gameCoinsEarned}</td>
                  <td>{row.tokensSpent}</td>
                  <td>{row.reviveCount}</td>
                  <td>{formatDateTime(row.startedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
