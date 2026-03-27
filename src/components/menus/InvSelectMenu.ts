import type { AnySelectMenuInteraction, Client } from 'discord.js';
import SelectMenu from '../../structures/SelectMenu';
import { apiFetch } from '../../utilities/ApiClient';
import { formatError } from '../../utilities/ErrorMessages';
import * as Routes from '../../utilities/Routes';
import { buildItemView } from '../../utilities/ItemViewBuilder';
import type { IInventoryItem } from '../../interfaces/IInventoryJSON';
import type { IPlayerJSON } from '../../interfaces/IPlayerJSON';

export default class InvSelectMenu extends SelectMenu {
  constructor() {
    super({ customId: 'inv_select', cooldown: 3, isAuthorOnly: true });
  }

  // customId format: inv_select:<pageOffset> — value is the _id of the selected item
  public async execute(
    interaction: AnySelectMenuInteraction,
    client: Client,
    args?: string[] | null
  ): Promise<void> {
    await interaction.deferUpdate();

    const docId = interaction.values[0]; // The MongoDB _id
    const discordId = interaction.user.id;

    if (!docId) {
      await interaction.editReply({
        content: 'No item selected!',
        files: [],
        components: [],
        embeds: []
      });
      return;
    }

    try {
      // Fetch the full inventory to find the specific item by _id
      const res = await apiFetch(Routes.inventory(discordId));
      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({
          content: formatError(body.error ?? 'Failed to load inventory'),
          files: [],
          components: [],
          embeds: []
        });
        return;
      }

      const inventory: IInventoryItem[] = body.builder.inventory || [];
      const player: IPlayerJSON = body.builder.player;

      // Find the exact item by _id
      const item = inventory.find((inv: IInventoryItem) => inv._id === docId);

      if (!item) {
        await interaction.editReply({
          content: 'Item not found in your inventory!',
          files: [],
          components: [],
          embeds: []
        });
        return;
      }

      // Build the item detail view with all action buttons
      const viewer = await buildItemView(player, item);
      await interaction.editReply({ ...viewer, embeds: viewer.embeds });
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
