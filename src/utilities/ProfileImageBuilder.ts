import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { type IPlayerJSON } from '../interfaces/IPlayerJSON';
import { type IItemJSON } from '../interfaces/IItemJSON';
import { type User } from 'discord.js';
import * as ItemManager from '../managers/ItemManager';
import { join } from 'path';

// --- CRITICAL FIX: Load the font directly from the project files ---
// process.cwd() ensures it always looks in the root folder, regardless of compiled dist/ paths
GlobalFonts.registerFromPath(
  join(process.cwd(), 'assets', 'NotoColorEmoji-Regular.ttf'),
  'NotoEmoji'
);

/**
 * Build a profile image.
 * @param player       - Player data from the API
 * @param discordUser  - Discord User object OR a plain avatar URL string (for worker threads)
 * @param itemCache    - Optional item lookup map. If omitted, falls back to ItemManager (main thread only).
 */
export async function build(
  player: IPlayerJSON,
  discordUser: User | string,
  itemCache?: Record<number, IItemJSON>
): Promise<Buffer> {
  // Resolve item lookup: use provided cache if available, otherwise fall back to ItemManager
  const getItem = (id: number): IItemJSON | undefined => {
    if (itemCache) return itemCache[id];
    return ItemManager.get(id);
  };

  // Increased height to 880 to comfortably fit the equipment panel
  const canvas = createCanvas(800, 880);
  const ctx = canvas.getContext('2d');

  // --- Svelte Logic Conversions ---
  const xpToNext = Math.floor(50 * (player.level || 1) ** 1.3);
  const xpProgress = Math.min(player.experience / xpToNext, 1);
  const totalAtk = player.stats?.atk || 0;
  const totalDef = player.stats?.def || 0;
  const currentHp = Math.floor(player.stats?.hp || 0);
  const maxHp = player.maxHp || 100;

  // --- 1. Background (Dark Theme) ---
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const bgGradient = ctx.createLinearGradient(0, 0, 0, 150);
  bgGradient.addColorStop(0, '#1a1a1a');
  bgGradient.addColorStop(1, '#111111');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, 150);

  // --- 2. Avatar ---
  const avatarSize = 120;
  const avatarX = 40;
  const avatarY = 40;

  ctx.save();
  ctx.beginPath();
  ctx.arc(
    avatarX + avatarSize / 2,
    avatarY + avatarSize / 2,
    avatarSize / 2,
    0,
    Math.PI * 2,
    true
  );
  ctx.closePath();
  ctx.clip();

  // Support both a Discord User object (main thread) and a plain URL string (worker thread)
  const avatarUrl =
    typeof discordUser === 'string'
      ? discordUser
      : discordUser.displayAvatarURL({ extension: 'png', size: 256 });
  const avatarImage = await loadImage(avatarUrl);
  ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(
    avatarX + avatarSize / 2,
    avatarY + avatarSize / 2,
    avatarSize / 2,
    0,
    Math.PI * 2,
    true
  );
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#10b981';
  ctx.stroke();

  // --- 3. User Info (Name, Privilege, ID) ---
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(player.username, 180, 75);

  // Fixed: Measure width while font is 36px!
  const nameWidth = ctx.measureText(player.username).width;

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`[${player.privilege.toUpperCase()}]`, 180 + nameWidth + 15, 72);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '14px monospace';
  ctx.fillText(`ID: ${player.id}`, 180, 100);

  // --- 4. Stats Grid ---
  const drawGridBox = (
    x: number,
    y: number,
    label: string,
    value: string,
    borderColor: string,
    valueColor: string
  ): void => {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, 180, 70);
    ctx.fillStyle = borderColor;
    ctx.fillRect(x, y, 4, 70);

    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.fillText(label.toUpperCase(), x + 15, y + 25);

    ctx.fillStyle = valueColor;
    ctx.font = 'bold 24px monospace';
    ctx.fillText(value, x + 15, y + 55);
  };

  drawGridBox(180, 130, 'Level', player.level.toString(), '#eab308', '#ffffff');
  drawGridBox(
    375,
    130,
    'Skill Points',
    player.skillPoints.toString(),
    '#3b82f6',
    '#ffffff'
  );
  drawGridBox(
    570,
    130,
    'Coins',
    player.coins.toLocaleString(),
    '#f59e0b',
    '#fbbf24'
  );

  // --- 5. XP Bar ---
  const barX = 180;
  const barY = 220;
  const barWidth = 570;
  const barHeight = 24;

  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth, barHeight, 12);
  ctx.fill();

  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth * xpProgress, barHeight, 12);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${player.experience.toLocaleString()} XP / ${xpToNext.toLocaleString()} XP`,
    barX + barWidth / 2,
    barY + 16
  );
  ctx.textAlign = 'left';

  // --- 6. Combat Stats Panel ---
  const panelY = 280;
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.roundRect(40, panelY, 710, 130, 8);
  ctx.fill();

  ctx.fillStyle = '#f87171';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('HEALTH POINTS', 60, panelY + 30);
  ctx.textAlign = 'right';
  ctx.fillText(`${currentHp} / ${maxHp}`, 730, panelY + 30);
  ctx.textAlign = 'left';

  const hpProgress = Math.min(currentHp / maxHp, 1);
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.roundRect(60, panelY + 45, 670, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.roundRect(60, panelY + 45, 670 * hpProgress, 12, 6);
  ctx.fill();

  const drawStatBox = (
    x: number,
    y: number,
    label: string,
    value: string,
    color: string
  ): void => {
    ctx.fillStyle = '#00000066';
    ctx.beginPath();
    ctx.roundRect(x, y, 325, 50, 6);
    ctx.fill();

    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(label, x + 15, y + 30);

    ctx.fillStyle = color;
    ctx.font = 'bold 22px monospace';
    ctx.fillText(value, x + 100, y + 33);
  };

  drawStatBox(60, panelY + 70, 'ATK', totalAtk.toString(), '#f87171');
  drawStatBox(405, panelY + 70, 'DEF', totalDef.toString(), '#60a5fa');

  // --- 7. Equipment Grid Panel ---
  const equipPanelY = 440;
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.roundRect(40, equipPanelY, 710, 400, 8);
  ctx.fill();

  // Equipment Header
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(60, equipPanelY + 30, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('EQUIPMENT', 75, equipPanelY + 35);

  // Grid Settings (4 columns, 3 rows)
  const equipSlots = [
    { key: 'Head', icon: '⛑️' },
    { key: 'Necklace', icon: '📿' },
    { key: 'Chest', icon: '👕' },
    { key: 'MainHand', icon: '⚔️' },
    { key: 'Legs', icon: '👖' },
    { key: 'OffHand', icon: '🛡️' },
    { key: 'Hands', icon: '🧤' },
    { key: 'RingA', icon: '💍' },
    { key: 'Feet', icon: '👢' },
    { key: 'RingB', icon: '💍' },
    { key: 'Pet', icon: '🐾' },
    { key: 'Special', icon: '✨' }
  ];

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

  const gridStartX = 60;
  const gridStartY = equipPanelY + 65;
  const boxWidth = 160;
  const boxHeight = 95;
  const gapX = 10;
  const gapY = 15;

  for (let i = 0; i < equipSlots.length; i++) {
    const slot = equipSlots[i];
    const col = i % 4;
    const row = Math.floor(i / 4);

    const boxX = gridStartX + col * (boxWidth + gapX);
    const boxY = gridStartY + row * (boxHeight + gapY);

    // Fetch item data if equipped
    const equippedRef = player.equipment
      ? (player.equipment as any)[slot.key]
      : null;
    let itemData = null;
    if (equippedRef?.itemId) {
      itemData = getItem(equippedRef.itemId) ?? null;
    }

    // Box BG & Outline
    ctx.fillStyle = '#00000066'; // bg-black/40
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff11';
    ctx.stroke();

    ctx.textAlign = 'center';

    // --- UPDATED EMOJI RENDERING ---
    ctx.fillStyle = '#ffffff66'; // Muted icon
    // Use the NotoEmoji font we registered above
    ctx.font = '20px "NotoEmoji", sans-serif';
    ctx.fillText(slot.icon, boxX + boxWidth / 2, boxY + 30);

    // Slot Key
    ctx.fillStyle = '#4b5563'; // text-gray-600
    // Instantly reset the font back to standard sans-serif for regular text
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(slot.key.toUpperCase(), boxX + boxWidth / 2, boxY + 45);

    if (itemData) {
      const color = RARITY_COLORS[itemData.rarity] || '#ffffff';

      // Truncate name if it's too long (using canvas maxWidth param)
      ctx.fillStyle = color;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(
        itemData.name,
        boxX + boxWidth / 2,
        boxY + 65,
        boxWidth - 10
      );

      // Item Level
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px sans-serif';
      ctx.fillText(`Lvl ${itemData.level}`, boxX + boxWidth / 2, boxY + 80);

      // Bottom Border (matches rarity)
      ctx.beginPath();
      ctx.moveTo(boxX + 15, boxY + boxHeight);
      ctx.lineTo(boxX + boxWidth - 15, boxY + boxHeight);
      ctx.lineWidth = 3;
      ctx.strokeStyle = color;
      ctx.stroke();
    } else {
      // Empty State
      ctx.fillStyle = '#374151'; // text-gray-700
      ctx.font = 'italic 12px sans-serif';
      ctx.fillText('Empty', boxX + boxWidth / 2, boxY + 70);
    }

    ctx.textAlign = 'left'; // Reset alignment for next loop iteration
  }

  return canvas.toBuffer('image/png');
}
