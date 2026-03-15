import logger from "./utilities/Logger";
import { Client, GatewayIntentBits } from "discord.js";
import { ClusterClient, getInfo } from "discord-hybrid-sharding";
import 'dotenv/config';
import EventHandler from "./handlers/EventHandler";
import SlashCommandHandler from "./handlers/SlashCommandHandler";
import ButtonHandler from "./handlers/ButtonHandler";
import SelectMenuHandler from "./handlers/SelectMenuHandler";
import ModalSubmitHandler from "./handlers/ModalSubmitHandler";
import WorkerPool from "./utilities/WorkerPool";
import PresenceManager from "./managers/PresenceManager";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  shards: getInfo().SHARD_LIST,          // Hybrid sharding tells us which shards this cluster owns
  shardCount: getInfo().TOTAL_SHARDS,    // Total shards across all clusters
});

// Attach the cluster client for IPC and broadcastEval
(client as any).cluster = new ClusterClient(client);

(async () => {
  try {
    new EventHandler(client);
    SlashCommandHandler.load();
    ButtonHandler.load();
    SelectMenuHandler.load();
    ModalSubmitHandler.load();
    await client.login(process.env.BOT_TOKEN);
  } catch (error) {
    logger.error(error, `[FATAL] Critical start-up error:`);
    process.exit(1);
  }
})();

async function shutdown(signal: string) {
  logger.info(`[System] Received ${signal}. Starting shutdown...`);

  try {
    client.destroy();
    logger.info('[System] Discord client destroyed.');

    PresenceManager.shutdown();
    await WorkerPool.shutdown();

    logger.info('[System] Shutdown complete. Goodbye!');
    process.exit(0);
  } catch (err) {
    logger.error(`[System] Error during shutdown: ${err}`);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error(reason, '[Fatal] Unhandled Rejection:');
});

process.on('uncaughtException', (error) => {
  logger.error(error, '[Fatal] Uncaught Exception:');
});
