import { ButtonInteraction, Client, MessageFlags } from "discord.js";
import Button from "../../structures/Button";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";

export default class MarketCancelButton extends Button {
  constructor() { super({ customId: "mkt_cancel", cooldown: 3, isAuthorOnly: true }); }

  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const listingId = args?.[0];
    if (!listingId) {
      await interaction.editReply({ content: '❌ Invalid listing reference.' });
      return;
    }

    try {
      const res = await apiFetch(Routes.marketCancel(), {
        method: 'POST',
        body: JSON.stringify({ discordId: interaction.user.id, listingId }),
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({ content: formatError(body.error ?? 'Failed to cancel listing.') });
        return;
      }

      await interaction.editReply({ content: '✅ **Listing cancelled.** Your items have been returned to your inventory.' });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code) });
    }
  }
}