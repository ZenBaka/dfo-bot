import { ButtonInteraction, Client, MessageFlags } from "discord.js";
import Button from "../../structures/Button";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";

export default class MarketBuyButton extends Button {
  constructor() { super({ customId: "mkt_buy", cooldown: 3, isAuthorOnly: false }); }

  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const listingId = args?.[0];
    if (!listingId) {
      await interaction.editReply({ content: '❌ Invalid listing reference.' });
      return;
    }

    try {
      const res = await apiFetch(Routes.marketBuy(), {
        method: 'POST',
        body: JSON.stringify({ discordId: interaction.user.id, listingId, quantity: 1 }),
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({ content: formatError(body.error ?? 'Purchase failed.') });
        return;
      }

      const itemName = body.item?.name ?? 'Unknown Item';
      await interaction.editReply({ content: `🪙 **Purchase complete!** You bought **${itemName}** from the Global Market.` });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code) });
    }
  }
}