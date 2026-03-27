import ModalSubmit from '../structures/ModalSubmit';
import {
  type ModalSubmitInteraction,
  Collection,
  type Client
} from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import logger from '../utilities/Logger';
import * as CooldownManager from '../managers/CooldownManager';
const filePath = join(__dirname, '../components/modals');

const _cache: Collection<string, ModalSubmit> = new Collection();

export function load(): void {
  const modalFiles = readdirSync(filePath).filter(
    (file) => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts')
  );

  if (modalFiles.length < 1) {
    logger.info(
      '[ModalSubmitHandler] No modal submit executable data to cache. Skipping step'
    );
    return;
  }

  for (const file of modalFiles) {
    let modal = require(join(filePath, file));
    modal = new modal.default();
    if (!(modal instanceof ModalSubmit)) continue;
    _cache.set(modal.customId, modal);
  }

  logger.info(
    `[ModalSubmitHandler] Cached a total of ${_cache.size} modal executable data`
  );
}

export async function handle(
  customId: string,
  interaction: ModalSubmitInteraction,
  client: Client
): Promise<void> {
  let id = customId;
  let target = null;
  if (customId.includes(':')) {
    const [name, ...args] = customId.split(':');
    id = name;
    target = args;
  }

  const modal = _cache.get(id);
  if (modal == null)
    throw new Error(
      `No modal executable data could be found for the ID: ${customId}`
    );

  const key = `m-${customId}-${interaction.user.id}`;

  if (CooldownManager.onCooldown(key)) return;

  await modal.execute(interaction, client, target);
  CooldownManager.addCooldown(key, modal.cooldown);
}
