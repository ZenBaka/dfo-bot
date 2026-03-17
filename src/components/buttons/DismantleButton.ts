import { ButtonInteraction, Client } from "discord.js";
import Button from "../../structures/Button";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";

export default class DismantleButton extends Button {
  constructor() {
    super('dismantle');
  }

  // customId format: dismantle:<docId>:<itemId>:<maxQuantity>
  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();

    const docId = args?.[0];
    const itemId = parseInt(args?.[1] ?? '-1', 10);
    const maxQty = parseInt(args?.[2] ?? '1', 10);

    if (!docId || isNaN(itemId)) {
      await interaction.editReply({ content: 'Error parsing item data!', files: [], components: [], embeds: [] });
      return;
    }

    // Dismantle entire stack (user can use modal for partial later if needed)
    const amount = maxQty;

    try {
      const res = await apiFetch(Routes.dismantle(), {
        method: 'POST',
        body: JSON.stringify({
          discordId: interaction.user.id,
          itemId,
          inventoryId: docId,
          amount,
        }),
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({ content: formatError(body.error ?? 'Dismantle failed'), files: [], components: [], embeds: [] });
        return;
      }

      await interaction.editReply({
        content: [
          `🔥 **${body.message}**`,
          ``,
          `🔥 Embers gained: **+${body.embersGained?.toLocaleString() ?? '???'}**`,
          `🔥 Total embers: **${body.newEmbers?.toLocaleString() ?? '???'}**`,
        ].join('\n'),
        files: [], components: [], embeds: []
      });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code), files: [], components: [], embeds: [] });
    }
  }

  public isAuthorOnly(): boolean { return true; }
  public cooldown(): number { return 3; }
}
