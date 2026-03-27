import { ModalSubmitInteraction, Client, MessageFlags } from "discord.js";
import ModalSubmit from "../../structures/ModalSubmit";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";

export default class BulkDismantleModal extends ModalSubmit {
  constructor() { super({ customId: "bulk_dismantle_modal", cooldown: 5, isAuthorOnly: true }); }

  public async execute(interaction: ModalSubmitInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const selectedValues = interaction.fields.getStringSelectValues('bulk_dismantle_select');

    if (!selectedValues || selectedValues.length === 0) {
      await interaction.editReply({ content: '❌ No items were selected.' });
      return;
    }

    const items = selectedValues.map(val => {
      const parts = val.split('-');
      if (parts.length >= 3) {
        return { inventoryId: parts[0], itemId: parseInt(parts[1], 10), amount: parseInt(parts[2], 10) };
      }
      return { itemId: parseInt(parts[0], 10), amount: parseInt(parts[1], 10) };
    }).filter(i => !isNaN(i.itemId) && !isNaN(i.amount) && i.amount > 0);

    if (items.length === 0) {
      await interaction.editReply({ content: '❌ Could not parse selected items.' });
      return;
    }

    try {
      const res = await apiFetch(Routes.bulkDismantle(), {
        method: 'POST',
        body: JSON.stringify({ discordId: interaction.user.id, items }),
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({ content: formatError(body.error ?? 'Bulk dismantle failed.') });
        return;
      }

      await interaction.editReply({
        content: `🔥 **Bulk Dismantle Complete!** ${body.message}\n🔥 Total Embers: **${body.newEmbers?.toLocaleString() ?? '???'}**`
      });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code) });
    }
  }
}
