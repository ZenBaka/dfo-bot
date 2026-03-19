/**   Copyright 2026 JG Game Studios (_capricorn. @ Discord)

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
   */

import logger, { flushAndClose } from "./utilities/Logger";
import { Client, GatewayIntentBits } from "discord.js";
import 'dotenv/config';
import EventHandler from "./handlers/EventHandler";
import SlashCommandHandler from "./handlers/SlashCommandHandler";
import ButtonHandler from "./handlers/ButtonHandler";
import SelectMenuHandler from "./handlers/SelectMenuHandler";
import ModalSubmitHandler from "./handlers/ModalSubmitHandler";
import WorkerPool from "./utilities/WorkerPool";
import PresenceManager from "./managers/PresenceManager";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

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
    flushAndClose();
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
  } catch (err) {
    logger.error(`[System] Error during shutdown: ${err}`);
  }

  // Flush logger BEFORE exit — prevents sonic-boom "not ready" crash
  flushAndClose();

  // Small delay to let the flush complete, then exit
  setTimeout(() => process.exit(0), 250);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error(reason, '[Fatal] Unhandled Rejection:');
});

process.on('uncaughtException', (error) => {
  logger.error(error, '[Fatal] Uncaught Exception:');
});
