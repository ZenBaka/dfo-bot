import type { ButtonInteraction, Client } from 'discord.js';
import Button from '../../structures/Button';
import { apiFetch } from '../../utilities/ApiClient';
import { formatError } from '../../utilities/ErrorMessages';
import * as Routes from '../../utilities/Routes';

export default class ChestStartButton extends Button {
  constructor() {
    super({ customId: 'chest_start', cooldown: 2, isAuthorOnly: true });
  }

  // customId format: chest_start:<chestId>
  public async execute(
    interaction: ButtonInteraction,
    client: Client,
    args?: string[] | null
  ): Promise<void> {
    await interaction.deferUpdate();

    const chestId = args?.[0];
    if (!chestId) {
      await interaction.editReply({
        content: 'Error parsing chest data!',
        files: [],
        components: [],
        embeds: []
      });
      return;
    }

    try {
      const res = await apiFetch(Routes.chests(), {
        method: 'POST',
        body: JSON.stringify({
          discordId: interaction.user.id,
          action: 'start',
          chestId
        })
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({
          content: formatError(body.error ?? 'Failed to start unlock'),
          files: [],
          components: [],
          embeds: []
        });
        return;
      }

      await interaction.editReply({
        content: `⏳ **Chest unlocking!** It will be ready to open in **${body.unlockTime ?? 'a while'}**.\n\nRun \`/chests\` again later to open it.`,
        files: [],
        components: []
      });
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
