import { db } from '../db/database';
import { emitAppData } from '../lib/events';
import type { AppSettings } from '../types/models';

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get('primary');
  if (!settings) throw new Error('Settings are not initialized');
  return settings;
}

export async function markGuideSeen(gameId: string): Promise<AppSettings> {
  const settings = await getSettings();
  settings.guidesSeen = { ...settings.guidesSeen, [gameId]: true };
  await db.settings.put(settings);
  emitAppData();
  return settings;
}

export async function hasSeenGuide(gameId: string): Promise<boolean> {
  const settings = await getSettings();
  return Boolean(settings.guidesSeen[gameId]);
}
