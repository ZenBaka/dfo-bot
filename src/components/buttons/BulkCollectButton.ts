import {
  type ButtonInteraction,
  type Client,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder
} from 'discord.js';
import Button from '../../structures/Button';
import * as ItemManager from '../../managers/ItemManager';
import { apiFetch } from '../../utilities/ApiClient';
import * as Routes from '../../utilities/Routes';
import type { IInventoryItem } from '../../interfaces/IInventoryJSON';

const ITEMS_PER_PAGE = 15;

export default class BulkCollectButton extends Button {
  constructor() {
    super({ customId: 'bulk_collect', cooldown: 3, isAuthorOnly: true });
  }

  // customId format: bulk_collect:<pageOffset>
  public async execute(
    interaction: ButtonInteraction,
    client: Client,
    args?: string[] | null
  ): Promise<void> {
    const pageOffset = parseInt(args?.[0] ?? '0', 10);

    const res = await apiFetch(Routes.inventory(interaction.user.id));
    if (!res.ok) return;
    const { data } = await res.json();
    const inventory: IInventoryItem[] = data?.inventory || [];

    const chunk = inventory.slice(pageOffset, pageOffset + ITEMS_PER_PAGE);
    const eligible = chunk.filter((inv) => {
      if (inv.isLocked) return false;
      if (inv.enhanceLevel > 0 || inv.statOverrides || inv.affixOverrides)
        return false;
      const def = ItemManager.get(inv.itemId);
      if (!def || def.type === 'Consumable') return false;
      return true;
    });

    if (eligible.length === 0) {
      await interaction.reply({
        content: '❌ No eligible items to collect on this page.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const options: StringSelectMenuOptionBuilder[] = [];
    for (const inv of eligible) {
      const def = ItemManager.get(inv.itemId);
      if (!def) continue;

      options.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(`${def.name} (x${inv.quantity})`)
          .setDescription(`${def.rarity} ${def.type} • Lvl ${def.level}`)
          .setValue(`${inv.itemId}-${inv.quantity}`)
      );
    }

    if (options.length === 0) return;

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('bulk_collect_select')
      .setPlaceholder('Select items to collect...')
      .setMinValues(1)
      .setMaxValues(options.length)
      .addOptions(options);

    const selectLabel = new LabelBuilder()
      .setLabel('Select items to archive')
      .setDescription(
        'Selected items move from inventory to your collection book'
      )
      .setStringSelectMenuComponent(selectMenu);

    const infoText = new TextDisplayBuilder().setContent(
      '-# ⚠️ THIS IS PERMANENT. Items are removed from your inventory and added to your Collection Book. Modified items will be skipped. This cannot be undone.'
    );

    const modal = new ModalBuilder()
      .setCustomId('bulk_collect_modal')
      .setTitle('📖 Bulk Collect Items')
      .addLabelComponents(selectLabel)
      .addTextDisplayComponents(infoText);

    await interaction.showModal(modal);
  }
}
