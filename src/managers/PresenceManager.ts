import { ActivityType, Client } from 'discord.js';
import logger from '../utilities/Logger';
import Routes from '../utilities/Routes';
import ItemManager from './ItemManager';
import { apiFetch } from '../utilities/ApiClient';

interface GameStats {
  players: number;
  items: number;
  scenarios: number;
}

const ROTATION_INTERVAL = 60_000;
const FETCH_INTERVAL = 300_000;

export default class PresenceManager {
  private static client: Client;
  private static rotationIndex: number = 0;
  private static rotationTimer: NodeJS.Timeout | null = null;
  private static fetchTimer: NodeJS.Timeout | null = null;
  private static totalGuilds: number = 0;

  private static stats: GameStats = {
    players: 0,
    items: 0,
    scenarios: 0,
  };

  public static async init(client: Client): Promise<void> {
    this.client = client;

    await this.fetchStats();
    this.fetchTimer = setInterval(() => this.fetchStats(), FETCH_INTERVAL);

    this.rotate();
    this.rotationTimer = setInterval(() => this.rotate(), ROTATION_INTERVAL);

    logger.info('[PresenceManager] Activity rotation started');
  }

  private static async fetchStats(): Promise<void> {
    try {
      const telemetryRes = await apiFetch('https://capi.gg/api/telemetry/db-stats');

      if (telemetryRes.ok) {
        const data = await telemetryRes.json();
        this.stats.players = data.players ?? this.stats.players;
        this.stats.items = data.items ?? this.stats.items;
      }

      const scenarioRes = await apiFetch(Routes.scenarios());

      if (scenarioRes.ok) {
        const data = await scenarioRes.json();
        this.stats.scenarios = data.count ?? this.stats.scenarios;
      }

      // Fetch total guild count across all clusters
      const cluster = (this.client as any).cluster;
      if (cluster) {
        try {
          const results = await cluster.broadcastEval((c: any) => c.guilds.cache.size);
          this.totalGuilds = results.reduce((acc: number, val: number) => acc + val, 0);
        } catch {
          this.totalGuilds = this.client.guilds.cache.size;
        }
      } else {
        this.totalGuilds = this.client.guilds.cache.size;
      }
    } catch (err) {
      logger.warn(`[PresenceManager] Failed to fetch stats: ${err}`);
    }
  }

  private static rotate(): void {
    if (!this.client.user) return;

    const activities = [
      { type: ActivityType.Watching, name: `${this.stats.players.toLocaleString()} players` },
      { type: ActivityType.Watching, name: `${this.totalGuilds.toLocaleString()} servers` },
      { type: ActivityType.Watching, name: `${this.stats.items.toLocaleString()} items` },
      { type: ActivityType.Watching, name: `${this.stats.scenarios.toLocaleString()} scenarios` },
      { type: ActivityType.Playing,  name: `capi.gg` },
    ];

    const current = activities[this.rotationIndex % activities.length];

    this.client.user.setPresence({
      activities: [{ name: current.name, type: current.type }],
      status: 'online',
    });

    this.rotationIndex++;
  }

  public static shutdown(): void {
    if (this.rotationTimer) clearInterval(this.rotationTimer);
    if (this.fetchTimer) clearInterval(this.fetchTimer);
    this.rotationTimer = null;
    this.fetchTimer = null;
  }
}
