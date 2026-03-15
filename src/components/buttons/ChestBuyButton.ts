import { ButtonInteraction, Client } from "discord.js";
import Button from "../../structures/Button";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";

export default class ChestBuyButton extends Button {
  constructor() {
    super('chest_buy');
  }

  // customId format: chest_buy:<tier>
  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();

    const tier = args?.[0];
    if (!tier) {
      await interaction.editReply({ content: 'Error parsing chest tier!', files: [], components: [] });
      return;
    }

    try {
      const res = await apiFetch(Routes.chests(), {
        method: 'POST',
        body: JSON.stringify({ discordId: interaction.user.id, action: 'buy', tier }),
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({ content: formatError(body.error ?? 'Failed to buy chest'), files: [], components: [] });
        return;
      }

      await interaction.editReply({
        content: `🛒 **Purchased a ${tier} Chest!**\n🪙 Cost: **${body.goldCost?.toLocaleString() ?? '???'}** gold\n💰 Balance: **${body.newBalance?.toLocaleString() ?? '???'}** gold\n\nRun \`/chests\` to view your vault.`,
        files: [], components: [],
      });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code), files: [], components: [] });
    }
  }

  public isAuthorOnly(): boolean { return true; }
  public cooldown(): number { return 3; }
}
