import { ButtonInteraction, Client, LabelBuilder, MessageFlags, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextDisplayBuilder } from "discord.js";
import Button from "../../structures/Button";
import ItemManager from "../../managers/ItemManager";
import { apiFetch } from "../../utilities/ApiClient";
import Routes from "../../utilities/Routes";
import type { IInventoryItem } from "../../interfaces/IInventoryJSON";

const ITEMS_PER_PAGE = 15;

export default class BulkDismantleButton extends Button {
  constructor() { super({ customId: "bulk_dismantle", cooldown: 3, isAuthorOnly: true }); }

  // customId format: bulk_dismantle:<pageOffset>
  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    const pageOffset = parseInt(args?.[0] ?? '0', 10);

    const res = await apiFetch(Routes.inventory(interaction.user.id));
    if (!res.ok) return;
    const { data } = await res.json();
    const inventory: IInventoryItem[] = data?.inventory || [];

    const chunk = inventory.slice(pageOffset, pageOffset + ITEMS_PER_PAGE);
    const eligible = chunk.filter(inv => {
      if (inv.isLocked) return false;
      if (inv.enhanceLevel > 0 || inv.statOverrides || inv.affixOverrides) return false;
      const def = ItemManager.get(inv.itemId);
      if (!def || def.type === 'Consumable') return false;
      return true;
    });

    if (eligible.length === 0) {
      await interaction.reply({ content: '❌ No eligible items to dismantle on this page.', flags: MessageFlags.Ephemeral });
      return;
    }

    const options: StringSelectMenuOptionBuilder[] = [];
    for (const inv of eligible) {
      const def = ItemManager.get(inv.itemId);
      if (!def) continue;

      options.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(`${def.name} (x${inv.quantity})`)
          .setDescription(`${def.rarity} ${def.type} • Lvl ${def.level}`)
          .setValue(`${inv.itemId}-${inv.quantity}`)
      );
    }

    if (options.length === 0) return;

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('bulk_dismantle_select')
      .setPlaceholder('Select items to dismantle...')
      .setMinValues(1)
      .setMaxValues(options.length)
      .addOptions(options);

    const selectLabel = new LabelBuilder()
      .setLabel('Select items to dismantle')
      .setDescription('All selected items will be destroyed for Embers')
      .setStringSelectMenuComponent(selectMenu);

    const infoText = new TextDisplayBuilder()
      .setContent('-# 🔥 Items are permanently destroyed and converted to Embers. Enhanced items return bonus embers.');

    const modal = new ModalBuilder()
      .setCustomId('bulk_dismantle_modal')
      .setTitle('🔥 Bulk Dismantle Items')
      .addLabelComponents(selectLabel)
      .addTextDisplayComponents(infoText);

    await interaction.showModal(modal);
  }
}
