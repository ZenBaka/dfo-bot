import type { ButtonInteraction, Client } from 'discord.js';
import Button from '../../structures/Button';
import { handleMarketPage } from './MarketPrevButton';

export default class MarketNextButton extends Button {
  constructor() {
    super({ customId: 'mkt_next', cooldown: 2, isAuthorOnly: true });
  }

  public async execute(
    interaction: ButtonInteraction,
    client: Client,
    args?: string[] | null
  ): Promise<void> {
    await interaction.deferUpdate();
    await handleMarketPage(interaction, args, 1);
  }
}
