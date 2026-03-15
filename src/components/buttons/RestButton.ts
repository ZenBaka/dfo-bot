import { ButtonInteraction, Client } from "discord.js";
import Button from "../../structures/Button";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";

export default class RestButton extends Button {
  constructor() {
    super('rest');
  }

  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();

    try {
      const res = await apiFetch(Routes.rest(), {
        method: 'POST',
        body: JSON.stringify({ discordId: interaction.user.id }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        await interaction.editReply({ content: formatError(result.error ?? 'Rest failed'), files: [], components: [] });
        return;
      }

      await interaction.editReply({
        content: [
          `🏨 **Rested at the Inn**`,
          `❤️ Restored **${result.healedAmount.toLocaleString()} HP** → ${result.newHp.toLocaleString()} / ${result.maxHp.toLocaleString()}`,
          `🪙 Cost: **${result.goldSpent.toLocaleString()}** Gold  •  💰 Balance: **${result.newBalance.toLocaleString()}** Gold`,
        ].join('\n'),
        files: [], components: [], embeds: []
      });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code), files: [], components: [] });
    }
  }

  public isAuthorOnly(): boolean { return true; }
  public cooldown(): number { return 5; }
}
