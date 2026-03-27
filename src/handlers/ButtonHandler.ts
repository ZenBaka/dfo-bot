import {
  type ButtonInteraction,
  Collection,
  MessageFlags,
  type Client
} from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import Button from '../structures/Button';
import logger from '../utilities/Logger';
import * as CooldownManager from '../managers/CooldownManager';
const filePath = join(__dirname, '../components/buttons');

const _cache: Collection<string, Button> = new Collection();

export function load(): void {
  const buttonFiles = readdirSync(filePath).filter(
    (file) => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts')
  );

  if (buttonFiles.length < 1) {
    logger.info(
      `[ButtonHandler] No button executable data to cache. Skipping step`
    );
    return;
  }

  for (const file of buttonFiles) {
    let button = require(join(filePath, file));
    button = new button.default();
    if (!(button instanceof Button)) continue;
    _cache.set(button.customId, button);
  }

  logger.info(`[ButtonHandler] Cached ${_cache.size} button executables`);
}

export async function handle(
  customId: string,
  interaction: ButtonInteraction,
  client: Client
): Promise<void> {
  let id = customId;
  let target = null;
  if (customId.startsWith('page_')) return;
  if (customId.includes(':')) {
    const [name, ...args] = customId.split(':');
    id = name;
    target = args;
  }

  const button = _cache.get(id);
  if (button == null) {
    await interaction.reply({
      content: 'This button is no longer supported or has deprecated code!',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (
    button.isAuthorOnly &&
    interaction.user.id !== interaction.message.interactionMetadata?.user.id
  )
    return;

  let key = `b-${id}-${interaction.user.id}`;
  if (customId === 'startNewDay') key = `adventure-${interaction.user.id}`;
  if (CooldownManager.onCooldown(key)) {
    const expireAt = CooldownManager.getExpiration(key);
    await interaction.reply({
      content: `⏳ You can use this button again <t:${expireAt}:R>.`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  await button.execute(interaction, client, target);
  CooldownManager.addCooldown(key, button.cooldown);
  logger.button(
    `${interaction.user.username} (${interaction.user.id}) used '${customId}'`
  );
}
