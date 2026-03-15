import { User } from 'discord.js';
import { IStepJSON } from '../interfaces/IStepJSON';
import { ICombatJSON } from '../interfaces/ICombatJSON';
import { IPlayerJSON } from '../interfaces/IPlayerJSON';
import { IItemJSON } from '../interfaces/IItemJSON';
import { IInventoryItem } from '../interfaces/IInventoryJSON';
import { ITaskJSON, IChestSlot } from '../interfaces/IGameJSON';
import ItemManager from '../managers/ItemManager';
import WorkerPool from './WorkerPool';
import type { LeaderboardEntry, LeaderboardConfig } from './LeaderboardImageBuilder';
import type { MarketListing, MarketPageConfig } from './MarketImageBuilder';
import type { TasksPageConfig } from './TasksImageBuilder';
import type { ChestsPageConfig } from './ChestsImageBuilder';

/**
 * High-level image generation API.
 * Routes all canvas work through the WorkerPool.
 */
export default class ImageService {

  private static serializeItemCache(): Record<number, IItemJSON> {
    const cache: Record<number, IItemJSON> = {};
    for (const [id, item] of ItemManager.cache) {
      cache[id] = item;
    }
    return cache;
  }

  public static adventure(data: IStepJSON | ICombatJSON): Promise<Buffer> {
    return WorkerPool.run('adventure', { data });
  }

  public static profile(player: IPlayerJSON, discordUser: User): Promise<Buffer> {
    return WorkerPool.run('profile', {
      player,
      avatarUrl: discordUser.displayAvatarURL({ extension: 'png', size: 256 }),
      itemCache: this.serializeItemCache(),
    });
  }

  public static inventory(chunk: IInventoryItem[], player: IPlayerJSON): Promise<Buffer> {
    return WorkerPool.run('inventory', {
      chunk,
      player,
      itemCache: this.serializeItemCache(),
    });
  }

  public static item(itemData: IItemJSON): Promise<Buffer> {
    return WorkerPool.run('item', { item: itemData });
  }

  public static leaderboard(entries: LeaderboardEntry[], config: LeaderboardConfig): Promise<Buffer> {
    return WorkerPool.run('leaderboard', { entries, config });
  }

  public static market(listings: MarketListing[], config: MarketPageConfig): Promise<Buffer> {
    return WorkerPool.run('market', { listings, config });
  }

  public static travel(playerLevel: number, currentZoneId: number): Promise<Buffer> {
    return WorkerPool.run('travel', { playerLevel, currentZoneId });
  }

  public static tasks(tasks: ITaskJSON[], config: TasksPageConfig): Promise<Buffer> {
    return WorkerPool.run('tasks', { tasks, config });
  }

  public static chests(chests: IChestSlot[], config: ChestsPageConfig): Promise<Buffer> {
    return WorkerPool.run('chests', { chests, config });
  }
}
