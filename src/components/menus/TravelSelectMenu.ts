import {
  type AnySelectMenuInteraction,
  type Client,
  MessageFlags
} from 'discord.js';
import SelectMenu from '../../structures/SelectMenu';
import { apiFetch } from '../../utilities/ApiClient';
import { formatError } from '../../utilities/ErrorMessages';
import * as Routes from '../../utilities/Routes';
import { getZone } from '../../utilities/ZoneData';

export default class TravelSelectMenu extends SelectMenu {
  constructor() {
    super({ customId: 'travel_select', cooldown: 5, isAuthorOnly: true });
  }

  public async execute(
    interaction: AnySelectMenuInteraction,
    client: Client
  ): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const zoneId = parseInt(interaction.values[0], 10);

    if (isNaN(zoneId)) {
      await interaction.editReply({ content: '❌ Invalid zone selection.' });
      return;
    }

    const zone = getZone(zoneId);

    try {
      const res = await apiFetch(Routes.travel(), {
        method: 'POST',
        body: JSON.stringify({ discordId: interaction.user.id, zoneId })
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({
          content: formatError(body.error ?? 'Travel failed.')
        });
        return;
      }

      await interaction.editReply({
        content: `🗺️ **Traveled to ${zone?.name ?? body.zoneName}!**\n\n> *${zone?.description ?? 'A new zone awaits.'}*\n\nUse \`/explore\` to begin adventuring here.`
      });
    } catch (err: any) {
      await interaction.editReply({
        content: formatError(err.message, err.code)
      });
    }
  }
}
