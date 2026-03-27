import SelectMenu from "../structures/SelectMenu";
import { AnySelectMenuInteraction, Collection, Client } from "discord.js";
import { readdirSync } from 'fs';
import logger from "../utilities/Logger";
import CooldownManager from "../managers/CooldownManager";
import { join } from "path";
const filePath = join(__dirname, "../components/menus");

export default class SelectMenuHandler {
  private static _cache: Collection<string, SelectMenu> = new Collection();

  public static load(): void {
    const menuFiles = readdirSync(filePath).filter(file =>
      (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts')
    );

    if (menuFiles.length < 1) {
      logger.info(`[SelectMenuHandler] No select menu executable data to cache. Skipping step`);
      return;
    }

    for (const file of menuFiles) {
      let menu = require(join(filePath, file));
      menu = new menu.default();
      if (!(menu instanceof SelectMenu)) continue;
      this._cache.set(menu.customId, menu);
    }

    logger.info(`[SelectMenuHandler] Cached ${this._cache.size} menu executables`);
  }

  public static async handle(customId: string, interaction: AnySelectMenuInteraction, client: Client) {
    let id = customId;
    let target = null;
    if (customId.includes(':')) {
      const [name, ...args] = customId.split(':');
      id = name;
      target = args;
    }

    try {
      const menu = this._cache.get(id);
      if (!menu) throw new Error(`No executable data could be found for menu with ID: ${customId}`);

      if (menu.isAuthorOnly && interaction.user.id !== interaction.message.interactionMetadata?.user.id) return;

      const key = `s-${customId}-${interaction.user.id}`;

      if (CooldownManager.onCooldown(key)) return;

      await menu.execute(interaction, client, target);
      CooldownManager.addCooldown(key, menu.cooldown);
    } catch (err) {
      throw err;
    }
  }
}