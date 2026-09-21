import Dexie, { type EntityTable } from 'dexie';
import type {
  AppSettings,
  ContactSubmission,
  GameSession,
  GameStat,
  Redemption,
  Wallet,
} from '../types/models';

export class VeloopDatabase extends Dexie {
  wallet!: EntityTable<Wallet, 'id'>;
  sessions!: EntityTable<GameSession, 'id'>;
  stats!: EntityTable<GameStat, 'gameId'>;
  redemptions!: EntityTable<Redemption, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;
  contacts!: EntityTable<ContactSubmission, 'id'>;

  constructor() {
    super('veloop-games-db');
    this.version(1).stores({
      wallet: 'id',
      sessions: 'id, gameId, startedAt, status',
      stats: 'gameId',
      redemptions: 'id, createdAt, kind',
      settings: 'id',
      contacts: 'id, createdAt',
    });
  }
}

export const db = new VeloopDatabase();
