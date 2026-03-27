import { AnySelectMenuInteraction, Client, MessageFlags, ModalBuilder, TextInputStyle } from "discord.js";
import SelectMenu from "../../structures/SelectMenu";
import ItemManager from "../../managers/ItemManager";

export default class MarketSellMenu extends SelectMenu {
  constructor() {
    super({ customId: "mkt_sell_select", cooldown: 3, isAuthorOnly: true });
  }

  // select value format: docId:itemId:maxQuantity
  public async execute(interaction: AnySelectMenuInteraction, client: Client, args?: string[] | null): Promise<void> {
    const selected = interaction.values[0];
    if (!selected) return;

    const [docId, itemIdStr, maxQtyStr] = selected.split(':');
    const itemId = parseInt(itemIdStr, 10);
    const maxQty = parseInt(maxQtyStr, 10);

    if (!docId || isNaN(itemId)) {
      await interaction.reply({ content: 'Error parsing item data!', flags: MessageFlags.Ephemeral });
      return;
    }

    const def = ItemManager.get(itemId);
    const itemName = def?.name ?? `Item #${itemId}`;
    const baseValue = def?.value ?? 0;

    // Show modal for quantity and price
    const modal = new ModalBuilder()
      .setCustomId(`mkt_sell_modal:${docId}:${itemId}`)
      .setTitle(`🏪 List: ${itemName.slice(0, 30)}`)
      .addLabelComponents(
        (label) =>
          label.setLabel('Quantity').setDescription(`How many to list (Max: ${maxQty})`)
          .setTextInputComponent((ti) =>
            ti.setCustomId('quantity')
              .setRequired(true)
              .setStyle(TextInputStyle.Short)
              .setPlaceholder(`1 - ${maxQty}`)
          )
      )
      .addLabelComponents(
        (label) =>
          label.setLabel('Price per unit (gold)').setDescription(`Suggested: ${baseValue.toLocaleString()}g (base value)`)
          .setTextInputComponent((ti) =>
            ti.setCustomId('price')
              .setRequired(true)
              .setStyle(TextInputStyle.Short)
              .setPlaceholder(`e.g. ${baseValue || 100}`)
          )
      );

    await interaction.showModal(modal);
  }
}
