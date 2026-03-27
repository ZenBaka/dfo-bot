import type { ButtonInteraction, Client } from 'discord.js';
import Button from '../../structures/Button';
import { apiFetch } from '../../utilities/ApiClient';
import { buildCombatResponse } from '../../utilities/CombatResponseBuilder';
import { formatError, formatCooldown } from '../../utilities/ErrorMessages';
import * as Routes from '../../utilities/Routes';
import { type IStepJSON } from '../../interfaces/IStepJSON';

export default class ExploreAgainButton extends Button {
  constructor() {
    super({ customId: 'explore_again', cooldown: 7, isAuthorOnly: true });
  }

  public async execute(
    interaction: ButtonInteraction,
    client: Client,
    args?: string[] | null
  ): Promise<void> {
    await interaction.deferUpdate();

    try {
      const res = await apiFetch(Routes.explore(), {
        method: 'POST',
        body: JSON.stringify({ discordId: interaction.user.id })
      });

      const data = (await res.json()) as IStepJSON;

      if (res.status === 429) {
        await interaction.editReply({
          content: formatCooldown('step', data.cooldownRemaining),
          files: [],
          components: [],
          embeds: []
        });
        return;
      }

      if (data.error) {
        await interaction.editReply({
          content: formatError(data.error),
          files: [],
          components: [],
          embeds: []
        });
        return;
      }

      const response = await buildCombatResponse(data);
      await interaction.editReply(response);
    } catch (err: any) {
      await interaction.editReply({
        content: formatError(err.message, err.code),
        files: [],
        components: [],
        embeds: []
      });
    }
  }
}
