import { AutocompleteInteraction, ChatInputCommandInteraction, Collection, MessageFlags, Client } from "discord.js";
import { readdirSync } from 'fs';
import { join } from "path";
import SlashCommand from "../structures/SlashCommand";
import logger from "../utilities/Logger";
import CooldownManager from "../managers/CooldownManager";
const filePath = join(__dirname, '../commands');

export default class SlashCommandHandler {
  private static _cache: Collection<string, SlashCommand> = new Collection();

  public static getCache(): Collection<string, SlashCommand> {
    return this._cache;
  }

  public static load(): void {
    const commandFiles = readdirSync(filePath).filter(file =>
      (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts')
    );

    for (const file of commandFiles) {
      let command = require(join(filePath, file));
      command = new command.default();
      if (!(command instanceof SlashCommand)) continue;
      this._cache.set(command.data.name, command);
    }

    logger.info(`[SlashCommandHandler] Cached a total of ${this._cache.size} commands`);
  }

  public static async handle(name: string, interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    const startTime = Date.now();

    try {
      const command = this._cache.get(name);
      if (!command) {
        await interaction.reply({ content: "This command is outdated or disabled", flags: MessageFlags.Ephemeral });
        return;
      }

      const key = `${name}-${interaction.user.id}`;

      if (CooldownManager.onCooldown(key)) {
        const expiresAt = CooldownManager.getExpiration(key);
        await interaction.reply({ content: `⏳ You can use this command again <t:${expiresAt}:R>.`, flags: MessageFlags.Ephemeral });
        return;
      }

      await command.execute(interaction, client);

      CooldownManager.addCooldown(key, command.cooldown);
      logger.command(`/${name} | ${interaction.user.username} (${interaction.user.id}) | ${interaction.guild?.name ?? 'DM'} | ${Date.now() - startTime}ms`);
    } catch (err) {
      throw err;
    }
  }

  public static async autocomplete(name: string, interaction: AutocompleteInteraction, client: Client): Promise<void> {
    const command = this._cache.get(name);
    if (!command) return;

    if (command.autocomplete) {
      try {
        await command.autocomplete(interaction, client);
      } catch (err) {
        logger.error(`Autocomplete failed for ${name}: ${err}`);
      }
    }
  }
}