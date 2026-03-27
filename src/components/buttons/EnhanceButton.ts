import { ButtonInteraction, Client } from "discord.js";
import Button from "../../structures/Button";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";

export default class EnhanceButton extends Button {
  constructor() {
    super({ customId: "enhance", cooldown: 3, isAuthorOnly: true });
  }

  // customId format: enhance:<docId>:<itemId>
  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();

    const docId = args?.[0];
    const itemId = parseInt(args?.[1] ?? '-1', 10);

    if (!docId || isNaN(itemId)) {
      await interaction.editReply({ content: 'Error parsing item data!', files: [], components: [], embeds: [] });
      return;
    }

    try {
      const res = await apiFetch(Routes.enhance(), {
        method: 'POST',
        body: JSON.stringify({ discordId: interaction.user.id, itemId, inventoryId: docId }),
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({ content: formatError(body.error ?? 'Enhancement failed'), files: [], components: [], embeds: [] });
        return;
      }

      const result = body;
      const lines = [
        `⬆️ **Enhancement ${result.succeeded ? 'Succeeded' : 'Failed'}!**`,
        ``,
        `📦 **${result.itemName}** → +${result.newLevel}`,
      ];

      if (result.succeeded) {
        lines.push(`✅ Enhancement applied! Stats increased.`);
      } else {
        lines.push(`❌ The enhancement failed. Gold and embers were consumed.`);
        if (result.destroyed) {
          lines.push(`💀 **The item was destroyed in the process!**`);
        }
      }

      lines.push(``, `🪙 Gold spent: **${result.goldCost?.toLocaleString() ?? '???'}**`);
      lines.push(`🔥 Embers spent: **${result.emberCost?.toLocaleString() ?? '???'}**`);

      await interaction.editReply({ content: lines.join('\n'), files: [], components: [], embeds: [] });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code), files: [], components: [], embeds: [] });
    }
  }
}
