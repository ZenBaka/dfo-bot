import { ModalSubmitInteraction, Client } from "discord.js";
import ModalSubmit from "../../structures/ModalSubmit";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";

export default class SellModal extends ModalSubmit {
  constructor() {
    super({ customId: "sell", cooldown: 3, isAuthorOnly: true });
  }

  // customId format: sell:<docId>
  public async execute(interaction: ModalSubmitInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();

    const docId = args?.[0];
    const amount = interaction.fields.getTextInputValue('ti1');
    const parsedAmount = parseInt(amount, 10);

    if (!docId || isNaN(parsedAmount)) {
      await interaction.editReply({ content: 'Invalid input! Please try again.' });
      return;
    }

    try {
      const res = await apiFetch(Routes.sell(), {
        method: 'POST',
        body: JSON.stringify({ discordId: interaction.user.id, inventoryId: docId, amount: parsedAmount }),
      });

      const { success, message, newBalance, error } = await res.json();

      if (!res.ok || !success) {
        await interaction.editReply({ content: formatError(error ?? 'Sell failed'), files: [], components: [], embeds: [] });
        return;
      }

      await interaction.editReply({
        content: `${message}\n💰 New Balance: **${newBalance?.toLocaleString() ?? '???'}** gold`,
        components: [], files: [], embeds: [],
      });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code), files: [], components: [], embeds: [] });
    }
  }
}
