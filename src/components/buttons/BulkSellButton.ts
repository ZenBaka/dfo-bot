import { ButtonInteraction, Client, LabelBuilder, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextDisplayBuilder } from "discord.js";
import Button from "../../structures/Button";
import ItemManager from "../../managers/ItemManager";
import { apiFetch } from "../../utilities/ApiClient";
import Routes from "../../utilities/Routes";
import type { IInventoryItem } from "../../interfaces/IInventoryJSON";

const ITEMS_PER_PAGE = 15;

export default class BulkSellButton extends Button {
  constructor() { super('bulk_sell'); }

  // customId format: bulk_sell:<pageOffset>
  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    const pageOffset = parseInt(args?.[0] ?? '0', 10);

    // Fetch inventory fresh from API
    const res = await apiFetch(Routes.inventory(interaction.user.id));
    if (!res.ok) return;
    const { data } = await res.json();
    const inventory: IInventoryItem[] = data?.inventory || [];

    // Get the page chunk and filter eligible items
    const chunk = inventory.slice(pageOffset, pageOffset + ITEMS_PER_PAGE);
    const eligible = chunk.filter(inv => {
      if (inv.isLocked) return false;
      if (inv.enhanceLevel > 0 || inv.statOverrides || inv.affixOverrides) return false;
      const def = ItemManager.get(inv.itemId);
      if (!def || def.type === 'Consumable') return false;
      return true;
    });

    if (eligible.length === 0) {
      await interaction.reply({ content: '❌ No eligible items to sell on this page.', ephemeral: true });
      return;
    }

    const options: StringSelectMenuOptionBuilder[] = [];
    for (const inv of eligible) {
      const def = ItemManager.get(inv.itemId);
      if (!def) continue;

      const totalValue = Math.floor(def.value * inv.quantity);
      options.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(`${def.name} (x${inv.quantity})`)
          .setDescription(`${def.rarity} ${def.type} • Sells for ${totalValue.toLocaleString()}g`)
          .setValue(`${inv.itemId}-${inv.quantity}`)  // Short — no _id needed for bulk sell
      );
    }

    if (options.length === 0) return;

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('bulk_sell_select')
      .setPlaceholder('Select items to sell...')
      .setMinValues(1)
      .setMaxValues(options.length)
      .addOptions(options);

    const selectLabel = new LabelBuilder()
      .setLabel('Select items to sell')
      .setDescription('All selected items will be sold for gold. Modified items are excluded.')
      .setStringSelectMenuComponent(selectMenu);

    const infoText = new TextDisplayBuilder()
      .setContent('-# Locked, consumable, and modified (enhanced/reforged) items are excluded.');

    const modal = new ModalBuilder()
      .setCustomId('bulk_sell_modal')
      .setTitle('🪙 Bulk Sell Items')
      .addLabelComponents(selectLabel)
      .addTextDisplayComponents(infoText);

    await interaction.showModal(modal);
  }

  public isAuthorOnly(): boolean { return true; }
  public cooldown(): number { return 3; }
}
