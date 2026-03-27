import type { ButtonInteraction, Client } from 'discord.js';
import Button from '../../structures/Button';
import { apiFetch } from '../../utilities/ApiClient';
import { formatError } from '../../utilities/ErrorMessages';
import * as Routes from '../../utilities/Routes';

export default class LockButton extends Button {
  constructor() {
    super({ customId: 'lock', cooldown: 2, isAuthorOnly: true });
  }

  // customId format: lock:<docId>:<isLocked 0|1>
  public async execute(
    interaction: ButtonInteraction,
    client: Client,
    args?: string[] | null
  ): Promise<void> {
    await interaction.deferUpdate();

    const docId = args?.[0];
    const currentlyLocked = args?.[1] === '1';

    if (!docId) {
      await interaction.editReply({
        content: 'Error parsing item data!',
        files: [],
        components: [],
        embeds: []
      });
      return;
    }

    try {
      const res = await apiFetch(Routes.lock(), {
        method: 'POST',
        body: JSON.stringify({
          discordId: interaction.user.id,
          inventoryId: docId,
          isLocked: !currentlyLocked // Toggle
        })
      });

      const { success, isLocked, error } = await res.json();

      if (!res.ok || !success) {
        await interaction.editReply({
          content: formatError(error ?? 'Lock failed'),
          files: [],
          components: [],
          embeds: []
        });
        return;
      }

      await interaction.editReply({
        content: isLocked ? '🔒 Item locked!' : '🔓 Item unlocked!',
        files: [],
        components: [],
        embeds: []
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
