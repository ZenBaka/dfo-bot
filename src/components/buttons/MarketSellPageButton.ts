import { ButtonInteraction, Client } from "discord.js";
import Button from "../../structures/Button";
import { formatError } from "../../utilities/ErrorMessages";
import { buildSellPage } from "../../commands/MarketCommand";

export default class MarketSellPageButton extends Button {
  constructor() {
    super('mkt_sell_page');
  }

  // customId format: mkt_sell_page:<pageNumber>
  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();

    const page = parseInt(args?.[0] ?? '0', 10);

    try {
      const result = await buildSellPage(interaction.user.id, page);
      await interaction.editReply(result);
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code), components: [] });
    }
  }

  public isAuthorOnly(): boolean { return true; }
  public cooldown(): number { return 2; }
}
