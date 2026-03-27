import type { ButtonInteraction, Client } from 'discord.js';
import Button from '../../structures/Button';
import { apiFetch } from '../../utilities/ApiClient';
import { formatError } from '../../utilities/ErrorMessages';
import * as Routes from '../../utilities/Routes';

export default class EquipButton extends Button {
  constructor() {
    super({ customId: 'equip', cooldown: 3, isAuthorOnly: true });
  }

  // customId format: equip:<docId>:<itemId>
  public async execute(
    interaction: ButtonInteraction,
    client: Client,
    args?: string[] | null
  ): Promise<void> {
    await interaction.deferUpdate();

    const docId = args?.[0];
    const itemId = parseInt(args?.[1] ?? '-1', 10);

    if (!docId || isNaN(itemId)) {
      await interaction.editReply({
        files: [],
        components: [],
        content: 'Error parsing item data!',
        embeds: []
      });
      return;
    }

    try {
      const res = await apiFetch(Routes.equip(), {
        method: 'POST',
        body: JSON.stringify({
          discordId: interaction.user.id,
          itemId,
          inventoryId: docId
        })
      });

      const { success, error, message } = await res.json();

      if (!res.ok || !success) {
        await interaction.editReply({
          files: [],
          components: [],
          content: formatError(error ?? 'Equip failed'),
          embeds: []
        });
        return;
      }

      await interaction.editReply({
        files: [],
        components: [],
        content: message ?? 'Item equipped!',
        embeds: []
      });
    } catch (err: any) {
      await interaction.editReply({
        files: [],
        components: [],
        content: formatError(err.message, err.code),
        embeds: []
      });
    }
  }
}
