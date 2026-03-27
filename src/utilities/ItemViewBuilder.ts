import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  type EmbedBuilder
} from 'discord.js';
import { type IInventoryItem } from '../interfaces/IInventoryJSON';
import * as ItemManager from '../managers/ItemManager';
import * as ImageService from './ImageService';
import { type IPlayerJSON } from '../interfaces/IPlayerJSON';
import { type IItemJSON } from '../interfaces/IItemJSON';

export interface ItemViewResponse {
  embeds: EmbedBuilder[];
  files: AttachmentBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
}

/**
 * Builds the single-item detail view with action buttons.
 * All buttons encode the inventory document _id for variant-safe operations.
 */
export async function buildItemView(
  player: IPlayerJSON,
  item: IInventoryItem
): Promise<ItemViewResponse> {
  const hydratedItem = ItemManager.get(item.itemId);

  if (!hydratedItem || !item || !player) {
    return { embeds: [], files: [], components: [] };
  }

  // Merge override data for display
  const displayItem: IItemJSON = { ...hydratedItem };
  if (item.statOverrides) {
    displayItem.stats = item.statOverrides;
  }
  if (item.affixOverrides) {
    displayItem.affixes = item.affixOverrides as any;
  }
  // Pass enhanceLevel for the image builder
  (displayItem as any).enhanceLevel = item.enhanceLevel || 0;

  const buffer = await ImageService.item(displayItem);
  const attachment = new AttachmentBuilder(buffer, {
    name: `${hydratedItem.itemId}.png`
  });

  const isWithinLevel = player.level >= hydratedItem.level;
  const hasSlot = hydratedItem.slot !== 'None';
  const isConsumable = hydratedItem.type === 'Consumable';
  const isLocked = item.isLocked;
  const isModified =
    item.enhanceLevel > 0 || !!item.statOverrides || !!item.affixOverrides;
  const docId = item._id; // MongoDB document _id for variant targeting

  // === ROW 1: Equip / Consume + Lock ===
  let equipText = 'Equip';
  if (!isWithinLevel)
    equipText = `Required Level: ${hydratedItem.level.toLocaleString()}`;
  if (!hasSlot) equipText = 'Cannot Equip';
  if (isLocked) equipText = '🔒 Locked Item';

  let equipDisabled = !isWithinLevel || !hasSlot || isLocked;
  let equipStyle = equipDisabled ? ButtonStyle.Secondary : ButtonStyle.Primary;
  if (isConsumable) {
    equipDisabled = false;
    equipStyle = ButtonStyle.Primary;
  }

  const equipButton = new ButtonBuilder()
    .setCustomId(
      isConsumable
        ? `consume:${docId}:${item.quantity}`
        : `equip:${docId}:${item.itemId}`
    )
    .setLabel(isConsumable ? 'Consume' : equipText)
    .setDisabled(equipDisabled)
    .setStyle(equipStyle);

  const lockButton = new ButtonBuilder()
    .setCustomId(`lock:${docId}:${item.isLocked ? '1' : '0'}`)
    .setLabel(item.isLocked ? '🔓 Unlock' : '🔒 Lock')
    .setStyle(item.isLocked ? ButtonStyle.Success : ButtonStyle.Danger);

  const row1 = new ActionRowBuilder<ButtonBuilder>().setComponents(
    equipButton,
    lockButton
  );

  // === ROW 2: Sell + Collect ===
  // Modified items can't be vendor-sold or collected
  let sellText = `🪙 Sell (${Math.floor(hydratedItem.value * item.quantity).toLocaleString()}g)`;
  const sellDisabled = isConsumable || isLocked;
  let collectText = 'Add to Collection';
  let collectDisabled = isConsumable || isLocked;

  if (isModified) {
    sellText = '📢 List on Market';
    collectText = '⚠️ Modified';
    collectDisabled = true;
  }
  if (isLocked) {
    sellText = '🔒 Locked';
    collectText = '🔒 Locked';
  }

  const sellButton = new ButtonBuilder()
    .setCustomId(
      isModified && !isLocked
        ? `market_redirect:${item.itemId}`
        : `sell:${docId}:${item.quantity}`
    )
    .setLabel(sellText)
    .setStyle(
      isConsumable || isLocked || isModified
        ? ButtonStyle.Secondary
        : ButtonStyle.Success
    )
    .setDisabled(sellDisabled && !isModified);

  const collectButton = new ButtonBuilder()
    .setCustomId(`collect:${docId}:${item.quantity}`)
    .setLabel(collectText)
    .setStyle(
      isConsumable || isLocked || isModified
        ? ButtonStyle.Secondary
        : ButtonStyle.Primary
    )
    .setDisabled(collectDisabled);

  const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
    sellButton,
    collectButton
  );

  // === ROW 3: Workshop (Enhance / Reforge / Dismantle) — non-consumable only ===
  const rows: ActionRowBuilder<ButtonBuilder>[] = [row1, row2];

  if (!isConsumable && hasSlot) {
    const enhanceButton = new ButtonBuilder()
      .setCustomId(`enhance:${docId}:${item.itemId}`)
      .setLabel(
        `⬆️ Enhance${item.enhanceLevel > 0 ? ` (+${item.enhanceLevel})` : ''}`
      )
      .setStyle(ButtonStyle.Primary)
      .setDisabled(isLocked);

    const reforgeButton = new ButtonBuilder()
      .setCustomId(`reforge:${docId}:${item.itemId}`)
      .setLabel('🔄 Reforge')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(isLocked);

    const dismantleButton = new ButtonBuilder()
      .setCustomId(`dismantle:${docId}:${item.itemId}:${item.quantity}`)
      .setLabel('🔥 Dismantle')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(isLocked);

    const row3 = new ActionRowBuilder<ButtonBuilder>().setComponents(
      enhanceButton,
      reforgeButton,
      dismantleButton
    );
    rows.push(row3);
  } else if (!isConsumable && !hasSlot) {
    // Items without a slot (like materials) can still be dismantled
    const dismantleButton = new ButtonBuilder()
      .setCustomId(`dismantle:${docId}:${item.itemId}:${item.quantity}`)
      .setLabel('🔥 Dismantle')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(isLocked);

    const row3 = new ActionRowBuilder<ButtonBuilder>().setComponents(
      dismantleButton
    );
    rows.push(row3);
  }

  return { embeds: [], files: [attachment], components: rows };
}
