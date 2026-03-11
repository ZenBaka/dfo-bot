import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { IInventoryItem } from "../interfaces/IInventoryJSON";
import ItemManager from "../managers/ItemManager";
import ImageService from "./ImageService";
import { IPlayerJSON } from "../interfaces/IPlayerJSON";

export interface ItemViewResponse {
  embeds: EmbedBuilder[];
  files: AttachmentBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
}

export async function buildItemView(player: IPlayerJSON, item: IInventoryItem): Promise<ItemViewResponse> {
  const hydratedItem = ItemManager.get(item.itemId);

  if (!hydratedItem || !item || !player) {
    return { embeds: [], files: [], components: [] };
  }

  const buffer = await ImageService.item(hydratedItem!);
  const attachment = new AttachmentBuilder(buffer, { name: `${hydratedItem?.itemId ?? 'item'}.png` });

  const isWithinLevel = player.level >= hydratedItem.level;
  const hasSlot = hydratedItem.slot !== 'None';
  const isConsumable = hydratedItem.type === 'Consumable';
  const isLocked = item.isLocked;

  let equipText = 'Equip';
  let sellText = `🪙 Sell Item: (${hydratedItem.value.toLocaleString()} Coins/ea x ${item.quantity}) ${Math.floor(hydratedItem.value * item.quantity).toLocaleString()} Coins`;
  let collectionText = 'Add to Collection';

  if (!isWithinLevel) equipText = `Required Level: ${hydratedItem.level.toLocaleString()}`;
  if (!hasSlot) equipText = 'Cannot Equip';
  if (isLocked) {
    equipText = '🔒 Locked Item';
    sellText = '🔒 Locked Item';
    collectionText = '🔒 Locked Item';
  }

  let disabled = !isWithinLevel || !hasSlot || isLocked;
  let style = disabled ? ButtonStyle.Secondary : ButtonStyle.Primary;
  if (isConsumable) { disabled = false; style = ButtonStyle.Primary; }

  const equipButton = new ButtonBuilder()
    .setCustomId(isConsumable ? `consume:${item.itemId}:${item.quantity}` : `equip:${item.itemId}`)
    .setLabel(isConsumable ? 'Consume' : equipText)
    .setDisabled(disabled).setStyle(style);

  const lockButton = new ButtonBuilder()
    .setCustomId(`lock:${item.itemId}:${item.isLocked ? '1' : '0'}`)
    .setLabel(item.isLocked ? '🔓 Unlock' : '🔒 Lock')
    .setStyle(item.isLocked ? ButtonStyle.Success : ButtonStyle.Danger);

  const sellButton = new ButtonBuilder()
    .setCustomId(`sell:${item.itemId}:${item.quantity}`)
    .setLabel(isConsumable ? 'Cannot Sell' : sellText)
    .setStyle(isConsumable || isLocked ? ButtonStyle.Secondary : ButtonStyle.Success)
    .setDisabled(isConsumable || isLocked);

  const collectButton = new ButtonBuilder()
    .setCustomId(`collect:${item.itemId}:${item.quantity}`)
    .setLabel(isConsumable ? 'Cannot Collect' : collectionText)
    .setStyle(isConsumable || isLocked ? ButtonStyle.Secondary : ButtonStyle.Primary)
    .setDisabled(isConsumable || isLocked);

  const row = new ActionRowBuilder<ButtonBuilder>().setComponents(equipButton, lockButton);
  const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(sellButton, collectButton);

  return { embeds: [], files: [attachment], components: [row, row2] };
}