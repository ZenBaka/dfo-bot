import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { type IInventoryItem } from '../interfaces/IInventoryJSON';
import { type IPlayerJSON } from '../interfaces/IPlayerJSON';
import { type IItemJSON } from '../interfaces/IItemJSON';
import * as ItemManager from '../managers/ItemManager';
import { join } from 'path';

try {
  GlobalFonts.registerFromPath(
    join(process.cwd(), 'assets', 'NotoColorEmoji-Regular.ttf'),
    'NotoEmoji'
  );
} catch (e) {}

const RARITY_COLORS: Record<string, string> = {
  Common: '#b0b0b0',
  Uncommon: '#2ecc71',
  Rare: '#3498db',
  Elite: '#e67e22',
  Epic: '#9b59b6',
  Legendary: '#f1c40f',
  Divine: '#00e5ff',
  Exotic: '#ff00cc'
};

const SLOT_ICONS: Record<string, string> = {
  Head: '⛑️',
  Necklace: '📿',
  Chest: '👕',
  MainHand: '⚔️',
  Legs: '👖',
  OffHand: '🛡️',
  Hands: '🧤',
  RingA: '💍',
  RingB: '💍',
  Feet: '👢',
  Pet: '🐾',
  Special: '✨'
};

const CATEGORY_ICONS: Record<string, string> = {
  Weapon: '⚔️',
  Armor: '🛡️',
  Accessory: '💍',
  Consumable: '🧪',
  Material: '🪵',
  Collectible: '🗿'
};

function getItemIcon(item: any): string {
  if (item.slot && SLOT_ICONS[item.slot]) return SLOT_ICONS[item.slot];
  return CATEGORY_ICONS[item.type] || '📦';
}

export async function build(
  chunk: IInventoryItem[],
  player: IPlayerJSON,
  itemCache?: Record<number, IItemJSON>
): Promise<Buffer> {
  const getItem = (id: number): IItemJSON | undefined => {
    if (itemCache) return itemCache[id];
    return ItemManager.get(id);
  };

  const canvas = createCanvas(900, 720);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const bgGradient = ctx.createLinearGradient(0, 0, 0, 200);
  bgGradient.addColorStop(0, '#1a1a1a');
  bgGradient.addColorStop(1, '#111111');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, 200);

  // Header
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.font = '32px "NotoEmoji", sans-serif';
  ctx.fillText('💼', 40, 60);
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(`${player.username.toUpperCase()}'S INVENTORY`, 85, 60, 500);

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'right';
  const goldFormatted = new Intl.NumberFormat('en-US').format(
    player.coins || 0
  );
  ctx.fillText(`LVL ${player.level}  •  ${goldFormatted} GOLD`, 860, 55);

  // Divider
  ctx.beginPath();
  ctx.moveTo(40, 80);
  ctx.lineTo(860, 80);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#ffffff1a';
  ctx.stroke();

  // Grid (5 cols x 3 rows = 15 items)
  const startX = 40;
  const startY = 110;
  const boxW = 150;
  const boxH = 180;
  const gapX = 17.5;
  const gapY = 20;

  for (let i = 0; i < chunk.length; i++) {
    const invEntry = chunk[i];
    const itemData = getItem(invEntry.itemId);

    const col = i % 5;
    const row = Math.floor(i / 5);
    const boxX = startX + col * (boxW + gapX);
    const boxY = startY + row * (boxH + gapY);

    // Box BG
    ctx.fillStyle = '#00000066';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 12);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff1a';
    ctx.stroke();

    if (itemData) {
      const color = RARITY_COLORS[itemData.rarity] || '#ffffff';
      const enhanceLevel = invEntry.enhanceLevel || 0;

      // Top Left: Lock Icon
      if (invEntry.isLocked) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "NotoEmoji", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('🔒', boxX + 10, boxY + 25);
      }

      // Top Left (after lock): Enhancement Badge
      if (enhanceLevel > 0) {
        const badgeX = invEntry.isLocked ? boxX + 30 : boxX + 8;
        const badgeText = `+${enhanceLevel}`;
        ctx.font = 'bold 10px sans-serif';
        const badgeW = ctx.measureText(badgeText).width + 8;

        ctx.fillStyle = '#92400e88'; // amber-900/50
        ctx.beginPath();
        ctx.roundRect(badgeX, boxY + 10, badgeW, 16, 3);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b66';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, badgeX + badgeW / 2, boxY + 22);
      }

      // Top Right: Quantity Pill
      ctx.fillStyle = '#00000099';
      ctx.beginPath();
      ctx.roundRect(boxX + boxW - 40, boxY + 10, 30, 18, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`x${invEntry.quantity}`, boxX + boxW - 25, boxY + 23);

      // Center: Emoji
      ctx.fillStyle = '#ffffff';
      ctx.font = '45px "NotoEmoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(getItemIcon(itemData), boxX + boxW / 2, boxY + 85);

      // Bottom Panel BG
      ctx.fillStyle = '#00000099';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY + 110, boxW, 70, [0, 0, 12, 12]);
      ctx.fill();

      // Item Name (with +level suffix if enhanced)
      ctx.fillStyle = color;
      ctx.font = 'bold 12px sans-serif';
      const displayName =
        enhanceLevel > 0 ? `${itemData.name} +${enhanceLevel}` : itemData.name;
      ctx.fillText(displayName, boxX + boxW / 2, boxY + 132, boxW - 10);

      // Type & Level
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px sans-serif';
      ctx.fillText(
        `${itemData.type.toUpperCase()}  |  LVL ${itemData.level}`,
        boxX + boxW / 2,
        boxY + 148
      );

      // Value
      ctx.fillStyle = '#eab308';
      ctx.font = '10px sans-serif';
      const totalValue = Math.floor((itemData.value || 0) * invEntry.quantity);
      ctx.fillText(
        `${totalValue.toLocaleString()}g`,
        boxX + boxW / 2,
        boxY + 164
      );

      // Bottom Rarity Border
      ctx.beginPath();
      ctx.moveTo(boxX + 10, boxY + boxH);
      ctx.lineTo(boxX + boxW - 10, boxY + boxH);
      ctx.lineWidth = 4;
      ctx.strokeStyle = color;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#374151';
      ctx.font = 'italic 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Unknown Item', boxX + boxW / 2, boxY + boxH / 2);
    }
  }

  return canvas.toBuffer('image/png');
}
