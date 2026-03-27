import type { ChatInputCommandInteraction, Client } from 'discord.js';
import SlashCommand from '../structures/SlashCommand';
import { type ICombatJSON } from '../interfaces/ICombatJSON';
import { apiFetch } from '../utilities/ApiClient';
import { buildCombatResponse } from '../utilities/CombatResponseBuilder';
import { formatError, formatCooldown } from '../utilities/ErrorMessages';
import * as Routes from '../utilities/Routes';

export default class AttackCommand extends SlashCommand {
  constructor() {
    super({
      name: 'attack',
      description: 'Attack the enemy in your encounter',
      category: 'Gaming',
      cooldown: 1.8,
      isGlobalCommand: true
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    client: Client
  ): Promise<void> {
    await interaction.deferReply();

    const res = await apiFetch(Routes.combat(), {
      method: 'POST',
      body: JSON.stringify({ discordId: interaction.user.id, action: 'attack' })
    });

    if (res.status === 429) {
      await interaction.editReply({ content: formatCooldown('combat') });
      return;
    }

    const data = (await res.json()) as ICombatJSON;

    if (data.error) {
      await interaction.editReply({ content: formatError(data.error) });
      return;
    }

    const response = await buildCombatResponse(data);
    await interaction.editReply(response);
  }
}
