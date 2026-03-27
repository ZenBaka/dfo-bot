import type { ChatInputCommandInteraction, Client } from 'discord.js';
import SlashCommand from '../structures/SlashCommand';
import { type IStepJSON } from '../interfaces/IStepJSON';
import { apiFetch } from '../utilities/ApiClient';
import { buildCombatResponse } from '../utilities/CombatResponseBuilder';
import { formatError, formatCooldown } from '../utilities/ErrorMessages';
import * as Routes from '../utilities/Routes';

export default class ExploreCommand extends SlashCommand {
  constructor() {
    super({
      name: 'explore',
      description: 'Explore the world and find items or enemy encounters!',
      category: 'Gaming',
      cooldown: 7,
      isGlobalCommand: true
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    client: Client
  ): Promise<void> {
    await interaction.deferReply();

    const res = await apiFetch(Routes.explore(), {
      method: 'POST',
      body: JSON.stringify({ discordId: interaction.user.id })
    });

    const data = (await res.json()) as IStepJSON;

    if (res.status === 429) {
      await interaction.editReply({
        content: formatCooldown('step', data.cooldownRemaining)
      });
      return;
    }

    if (res.status === 404) {
      await interaction.editReply({
        content: formatError('', 'PLAYER_NOT_FOUND')
      });
      return;
    }

    if (data.error) {
      await interaction.editReply({ content: formatError(data.error) });
      return;
    }

    const response = await buildCombatResponse(data);
    await interaction.editReply(response);
  }
}
