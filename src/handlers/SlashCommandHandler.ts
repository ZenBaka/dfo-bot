import {
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  Collection,
  MessageFlags,
  type Client
} from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import SlashCommand from '../structures/SlashCommand';
import logger from '../utilities/Logger';
import * as CooldownManager from '../managers/CooldownManager';
const filePath = join(__dirname, '../commands');

export const cache: Collection<string, SlashCommand> = new Collection();

export function load(): void {
  const commandFiles = readdirSync(filePath).filter(
    (file) => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts')
  );

  for (const file of commandFiles) {
    let command = require(join(filePath, file));
    command = new command.default();
    if (!(command instanceof SlashCommand)) continue;
    cache.set(command.data.name, command);
  }

  logger.info(`[SlashCommandHandler] Cached a total of ${cache.size} commands`);
}

export async function handle(
  name: string,
  interaction: ChatInputCommandInteraction,
  client: Client
): Promise<void> {
  const startTime = Date.now();

  const command = cache.get(name);
  if (!command) {
    await interaction.reply({
      content: 'This command is outdated or disabled',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const key = `${name}-${interaction.user.id}`;

  if (CooldownManager.onCooldown(key)) {
    const expiresAt = CooldownManager.getExpiration(key);
    await interaction.reply({
      content: `⏳ You can use this command again <t:${expiresAt}:R>.`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  await command.execute(interaction, client);

  CooldownManager.addCooldown(key, command.cooldown);
  logger.command(
    `/${name} | ${interaction.user.username} (${interaction.user.id}) | ${interaction.guild?.name ?? 'DM'} | ${Date.now() - startTime}ms`
  );
}

export async function autocomplete(
  name: string,
  interaction: AutocompleteInteraction,
  client: Client
): Promise<void> {
  const command = cache.get(name);
  if (!command) return;

  if (command.autocomplete) {
    try {
      await command.autocomplete(interaction, client);
    } catch (err) {
      logger.error(`Autocomplete failed for ${name}: ${err}`);
    }
  }
}
