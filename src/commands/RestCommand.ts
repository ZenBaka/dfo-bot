import { ChatInputCommandInteraction, Client } from "discord.js";
import SlashCommand from "../structures/SlashCommand";
import { apiFetch } from "../utilities/ApiClient";
import { formatError } from "../utilities/ErrorMessages";
import Routes from "../utilities/Routes";

export default class RestCommand extends SlashCommand {
  constructor() {
    super({
      name: "rest",
      description: "Rest at the inn to restore HP (costs gold)",
      category: "Gaming",
      cooldown: 5,
      isGlobalCommand: true
    });
  }

  public async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    await interaction.deferReply();

    try {
      // Go straight to POST — the endpoint returns appropriate errors for full HP, no gold, etc.
      const res = await apiFetch(Routes.rest(), {
        method: 'POST',
        body: JSON.stringify({ discordId: interaction.user.id }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        // Handle full HP case gracefully
        if (result.error?.includes('full') || result.error?.includes('already')) {
          await interaction.editReply({ content: '❤️ You are already at full HP!' });
          return;
        }
        await interaction.editReply({ content: formatError(result.error ?? 'Rest failed') });
        return;
      }

      await interaction.editReply({
        content: [
          `🏨 **Rested at the Inn**`,
          ``,
          `❤️ Restored **${result.healedAmount?.toLocaleString() ?? '???'} HP** → ${result.newHp?.toLocaleString() ?? '???'} / ${result.maxHp?.toLocaleString() ?? '???'}`,
          `🪙 Cost: **${result.goldSpent?.toLocaleString() ?? '???'}** Gold`,
          `💰 Balance: **${result.newBalance?.toLocaleString() ?? '???'}** Gold`,
        ].join('\n'),
      });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code) });
    }
  }
}
