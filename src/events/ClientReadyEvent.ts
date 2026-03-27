import { type Client } from 'discord.js';
import Event from '../structures/Event';
import logger from '../utilities/Logger';
import * as ItemManager from '../managers/ItemManager';
import * as WorkerPool from '../utilities/WorkerPool';
import * as PresenceManager from '../managers/PresenceManager';

export default class ClientReadyEvent extends Event {
  constructor() {
    super({
      name: 'clientReady',
      isOnce: true
    });
  }

  public async execute(client: Client): Promise<void> {
    // Use cluster id from hybrid sharding, fallback to shard id
    const clusterId = (client as any).cluster?.id ?? client.shard?.ids[0] ?? 0;
    logger.info(
      `[${this.constructor.name}] Successfully logged in as ${client.user?.tag}! (Cluster ${clusterId})`
    );

    // CRITICAL: Signal to the ClusterManager that this cluster is ready
    // Without this, the manager will timeout waiting for this cluster
    (client as any).cluster?.triggerReady();

    // Initialize the image rendering worker pool
    WorkerPool.init();

    // Stagger API requests by cluster ID to prevent slamming capi.gg
    const delayMs = 1500 + clusterId * 2500;

    setTimeout(async () => {
      logger.info(
        `[Cluster ${clusterId}] Initiating staggered ItemManager sync...`
      );
      await ItemManager.refresh();

      // Start rotating presence after items are loaded
      await PresenceManager.init(client);
    }, delayMs);
  }
}
