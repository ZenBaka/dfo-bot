import { ModalSubmitInteraction, Client, MessageFlags } from "discord.js";
import ModalSubmit from "../../structures/ModalSubmit";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";
import ItemManager from "../../managers/ItemManager";

export default class MarketSellModal extends ModalSubmit {
  constructor() {
    super({ customId: "mkt_sell_modal", cooldown: 5, isAuthorOnly: true });
  }

  // customId format: mkt_sell_modal:<docId>:<itemId>
  public async execute(interaction: ModalSubmitInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const docId = args?.[0];
    const itemId = parseInt(args?.[1] ?? '-1', 10);

    const quantityRaw = interaction.fields.getTextInputValue('quantity').trim();
    const priceRaw = interaction.fields.getTextInputValue('price').trim();

    const quantity = parseInt(quantityRaw, 10);
    const pricePerUnit = parseInt(priceRaw, 10);

    if (!docId || isNaN(itemId)) {
      await interaction.editReply({ content: '❌ Error parsing item data. Try again from `/market sell`.' });
      return;
    }

    if (isNaN(quantity) || quantity < 1) {
      await interaction.editReply({ content: '❌ Invalid quantity. Enter a number 1 or higher.' });
      return;
    }

    if (isNaN(pricePerUnit) || pricePerUnit < 1) {
      await interaction.editReply({ content: '❌ Invalid price. Enter a number 1 or higher.' });
      return;
    }

    try {
      const res = await apiFetch(Routes.marketList(), {
        method: 'POST',
        body: JSON.stringify({
          discordId: interaction.user.id,
          itemId,
          inventoryId: docId,
          quantity,
          pricePerUnit,
        }),
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({ content: formatError(body.error ?? 'Failed to create listing') });
        return;
      }

      const def = ItemManager.get(itemId);
      const itemName = def?.name ?? `Item #${itemId}`;
      const enhTag = body.listing?.enhanceLevel > 0 ? ` (+${body.listing.enhanceLevel})` : '';
      const totalGold = quantity * pricePerUnit;

      await interaction.editReply({
        content: [
          `🏪 **Listed on the Global Market!**`,
          ``,
          `📦 **${itemName}${enhTag}** x${quantity}`,
          `🪙 Price: **${pricePerUnit.toLocaleString()}** gold each`,
          `💰 Total if sold: **${totalGold.toLocaleString()}** gold (5% tax applies)`,
          ``,
          `Use \`/market listings\` to view or cancel your listings.`,
        ].join('\n'),
      });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code) });
    }
  }
}
