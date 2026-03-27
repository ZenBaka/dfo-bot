import { type ButtonInteraction, type Client, MessageFlags } from 'discord.js';
import Button from '../../structures/Button';

export default class MarketRedirectButton extends Button {
  constructor() {
    super({ customId: 'market_redirect', cooldown: 2, isAuthorOnly: true });
  }

  // customId format: market_redirect:<itemId>
  public async execute(
    interaction: ButtonInteraction,
    client: Client,
    args?: string[] | null
  ): Promise<void> {
    const itemId = args?.[0] ?? 'unknown';

    await interaction.reply({
      content: `📢 **Modified items cannot be vendor-sold.**\n\nUse \`/market sell item:${itemId} quantity:1 price:<your price>\` to list this item on the Global Market.\n\nAlternatively, you can **🔥 Dismantle** it for Embers.`,
      flags: MessageFlags.Ephemeral
    });
  }
}
