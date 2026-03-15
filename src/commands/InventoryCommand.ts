import {
  ChatInputCommandInteraction, Client, EmbedBuilder, AttachmentBuilder,
  ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import SlashCommand from "../structures/SlashCommand";
import { IInventoryItem } from "../interfaces/IInventoryJSON";
import { IPlayerJSON } from "../interfaces/IPlayerJSON";
import PaginatorBuilder from "../utilities/PaginatorBuilder";
import Routes from "../utilities/Routes";
import { apiFetch } from "../utilities/ApiClient";
import { formatError } from "../utilities/ErrorMessages";
import ItemManager from "../managers/ItemManager";
import ImageService from "../utilities/ImageService";

export default class InventoryCommand extends SlashCommand {
  constructor() {
    super('inventory', 'View your inventory and manage items', 'General');
    // No options — the select menu handles item selection
  }

  public async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    await interaction.deferReply();

    const res = await apiFetch(Routes.inventory(interaction.user.id));

    const { success, data, error }: { success: boolean, data: any, error?: string } = await res.json();

    if (res.status === 400 || res.status === 401 || res.status === 404 || res.status === 500) {
      await interaction.editReply({ content: formatError(error ?? 'Unknown error') });
      return;
    }

    const inventory = data.inventory as IInventoryItem[];
    const player = data.player as IPlayerJSON;

    if (!inventory || inventory.length === 0) {
      await interaction.editReply({ content: `🎒 **${interaction.user.username}**'s inventory is completely empty.` });
      return;
    }

    const ITEMS_PER_PAGE = 15;
    const pages: EmbedBuilder[] = [];
    const files: AttachmentBuilder[] = [];
    const extraRows: ActionRowBuilder<any>[][] = [];

    for (let i = 0; i < inventory.length; i += ITEMS_PER_PAGE) {
      const chunk = inventory.slice(i, i + ITEMS_PER_PAGE);

      const imageBuffer = await ImageService.inventory(chunk, player);
      const fileName = `inventory_page_${i}.png`;
      const attachment = new AttachmentBuilder(imageBuffer, { name: fileName });

      const pageEmbed = new EmbedBuilder()
        .setColor('#10b981')
        .setImage(`attachment://${fileName}`);

      pages.push(pageEmbed);
      files.push(attachment);

      const pageRows: ActionRowBuilder<any>[] = [];

      // === SELECT MENU: Pick an item to view details ===
      const selectOptions: StringSelectMenuOptionBuilder[] = [];
      for (const inv of chunk) {
        const def = ItemManager.get(inv.itemId);
        if (!def) continue;
        const enhTag = inv.enhanceLevel > 0 ? ` +${inv.enhanceLevel}` : '';
        selectOptions.push(
          new StringSelectMenuOptionBuilder()
            .setLabel(`${def.name}${enhTag} (x${inv.quantity})`)
            .setDescription(`${def.rarity} ${def.type} • Lvl ${def.level}`)
            .setValue(inv._id)
        );
      }

      if (selectOptions.length > 0) {
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`inv_select:${i}`)
          .setPlaceholder('Select an item to view details...')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(selectOptions.slice(0, 25));

        pageRows.push(new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(selectMenu));
      }

      // === BULK ACTION BUTTONS ===
      const eligibleCount = chunk.filter(inv => {
        if (inv.isLocked) return false;
        const def = ItemManager.get(inv.itemId);
        if (!def || def.type === 'Consumable') return false;
        return true;
      }).length;

      if (eligibleCount > 0) {
        pageRows.push(
          new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
              .setCustomId(`bulk_sell:${i}`)
              .setLabel(`🪙 Bulk Sell (${eligibleCount})`)
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`bulk_collect:${i}`)
              .setLabel(`📖 Bulk Collect (${eligibleCount})`)
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`bulk_dismantle:${i}`)
              .setLabel(`🔥 Bulk Dismantle (${eligibleCount})`)
              .setStyle(ButtonStyle.Danger),
          )
        );
      }

      extraRows.push(pageRows);
    }

    const paginator = new PaginatorBuilder()
      .setPages(pages)
      .setFiles(files)
      .setExtraRows(extraRows)
      .setTargetUser(interaction.user.id)
      .setIdleTimeout(60_000);

    await paginator.start(interaction);
  }

  public isGlobalCommand(): boolean { return true; }
  public cooldown(): number { return 5; }
}
