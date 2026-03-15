import { ModalSubmitInteraction, Client } from "discord.js";
import ModalSubmit from "../../structures/ModalSubmit";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";

export default class CollectModal extends ModalSubmit {
  constructor() {
    super('collect');
  }

  // customId format: collect:<docId>
  public async execute(interaction: ModalSubmitInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();

    const docId = args?.[0];
    const amount = interaction.fields.getTextInputValue('ti1');
    const parsedAmount = parseInt(amount, 10);

    if (!docId || isNaN(parsedAmount)) {
      await interaction.editReply({ content: 'Invalid input! Please try again.', files: [], components: [], embeds: [] });
      return;
    }

    try {
      const res = await apiFetch(Routes.collectionAdd(), {
        method: 'POST',
        body: JSON.stringify({ discordId: interaction.user.id, inventoryId: docId, amount: parsedAmount }),
      });

      const { success, message, error } = await res.json();

      if (!res.ok || !success) {
        await interaction.editReply({ content: formatError(error ?? 'Collection failed'), components: [], files: [], embeds: [] });
        return;
      }

      await interaction.editReply({ content: message ?? 'Items collected!', components: [], files: [], embeds: [] });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code), components: [], files: [], embeds: [] });
    }
  }

  public isAuthorOnly(): boolean { return true; }
  public cooldown(): number { return 2; }
}
