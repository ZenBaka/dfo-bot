import { type User } from 'discord.js';
import { type IStepJSON } from '../interfaces/IStepJSON';
import { type ICombatJSON } from '../interfaces/ICombatJSON';
import { type IPlayerJSON } from '../interfaces/IPlayerJSON';
import { type IItemJSON } from '../interfaces/IItemJSON';
import { type IInventoryItem } from '../interfaces/IInventoryJSON';
import type { ITaskJSON, IChestSlot } from '../interfaces/IGameJSON';
import * as ItemManager from '../managers/ItemManager';
import * as WorkerPool from './WorkerPool';
import type {
  LeaderboardEntry,
  LeaderboardConfig
} from './LeaderboardImageBuilder';
import type { MarketListing, MarketPageConfig } from './MarketImageBuilder';
import type { TasksPageConfig } from './TasksImageBuilder';
import type { ChestsPageConfig } from './ChestsImageBuilder';

function serializeItemCache(): Record<number, IItemJSON> {
  const cache: Record<number, IItemJSON> = {};
  for (const [id, item] of ItemManager.cache) {
    cache[id] = item;
  }
  return cache;
}

export async function adventure(data: IStepJSON | ICombatJSON): Promise<Buffer> {
  return WorkerPool.run('adventure', { data });
}

export async function profile(
  player: IPlayerJSON,
  discordUser: User
): Promise<Buffer> {
  return WorkerPool.run('profile', {
    player,
    avatarUrl: discordUser.displayAvatarURL({ extension: 'png', size: 256 }),
    itemCache: serializeItemCache()
  });
}

export async function inventory(
  chunk: IInventoryItem[],
  player: IPlayerJSON
): Promise<Buffer> {
  return WorkerPool.run('inventory', {
    chunk,
    player,
    itemCache: serializeItemCache()
  });
}

export async function item(itemData: IItemJSON): Promise<Buffer> {
  return WorkerPool.run('item', { item: itemData });
}

export async function leaderboard(
  entries: LeaderboardEntry[],
  config: LeaderboardConfig
): Promise<Buffer> {
  return WorkerPool.run('leaderboard', { entries, config });
}

export async function market(
  listings: MarketListing[],
  config: MarketPageConfig
): Promise<Buffer> {
  return WorkerPool.run('market', { listings, config });
}

export async function travel(
  playerLevel: number,
  currentZoneId: number
): Promise<Buffer> {
  return WorkerPool.run('travel', { playerLevel, currentZoneId });
}

export async function tasks(
  tasks: ITaskJSON[],
  config: TasksPageConfig
): Promise<Buffer> {
  return WorkerPool.run('tasks', { tasks, config });
}

export async function chests(
  chests: IChestSlot[],
  config: ChestsPageConfig
): Promise<Buffer> {
  return WorkerPool.run('chests', { chests, config });
}
