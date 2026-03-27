import { ActivityType, type Client } from 'discord.js';
import logger from '../utilities/Logger';
import * as Routes from '../utilities/Routes';
import { apiFetch } from '../utilities/ApiClient';

interface GameStats {
  players: number;
  items: number;
  scenarios: number;
}

const ROTATION_INTERVAL = 60_000;
const FETCH_INTERVAL = 300_000;

let client: Client;
let rotationIndex: number = 0;
let rotationTimer: NodeJS.Timeout | null = null;
let fetchTimer: NodeJS.Timeout | null = null;
let totalGuilds: number = 0;

const stats: GameStats = {
  players: 0,
  items: 0,
  scenarios: 0
};

export async function init(newClient: Client): Promise<void> {
  client = newClient;

  await fetchStats();
  fetchTimer = setInterval(() => fetchStats(), FETCH_INTERVAL);

  rotate();
  rotationTimer = setInterval(() => rotate(), ROTATION_INTERVAL);

  logger.info('[PresenceManager] Activity rotation started');
}

async function fetchStats(): Promise<void> {
  try {
    const telemetryRes = await apiFetch(
      'https://capi.gg/api/telemetry/db-stats'
    );

    if (telemetryRes.ok) {
      const data = await telemetryRes.json();
      stats.players = data.players ?? stats.players;
      stats.items = data.items ?? stats.items;
    }

    const scenarioRes = await apiFetch(Routes.scenarios());

    if (scenarioRes.ok) {
      const data = await scenarioRes.json();
      stats.scenarios = data.count ?? stats.scenarios;
    }

    // Fetch total guild count across all clusters
    const cluster = (client! as any).cluster;
    if (cluster) {
      try {
        const results = await cluster.broadcastEval(
          (c: any) => c.guilds.cache.size
        );
        totalGuilds = results.reduce(
          (acc: number, val: number) => acc + val,
          0
        );
      } catch {
        totalGuilds = client!.guilds.cache.size;
      }
    } else {
      totalGuilds = client!.guilds.cache.size;
    }
  } catch (err) {
    logger.warn(`[PresenceManager] Failed to fetch stats: ${err}`);
  }
}

function rotate(): void {
  if (!client!.user) return;

  const activities = [
    {
      type: ActivityType.Watching,
      name: `${stats.players.toLocaleString()} players`
    },
    {
      type: ActivityType.Watching,
      name: `${totalGuilds.toLocaleString()} servers`
    },
    {
      type: ActivityType.Watching,
      name: `${stats.items.toLocaleString()} items`
    },
    {
      type: ActivityType.Watching,
      name: `${stats.scenarios.toLocaleString()} scenarios`
    },
    { type: ActivityType.Playing, name: `capi.gg` }
  ];

  const current = activities[rotationIndex % activities.length];

  client!.user.setPresence({
    activities: [{ name: current.name, type: current.type }],
    status: 'online'
  });

  rotationIndex++;
}

export function shutdown(): void {
  if (rotationTimer) clearInterval(rotationTimer);
  if (fetchTimer) clearInterval(fetchTimer);
  rotationTimer = null;
  fetchTimer = null;
}
