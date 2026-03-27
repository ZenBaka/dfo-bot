import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { join } from 'path';
import type { IChestSlot } from '../interfaces/IGameJSON';

try {
  GlobalFonts.registerFromPath(
    join(process.cwd(), 'assets', 'NotoColorEmoji-Regular.ttf'),
    'NotoEmoji'
  );
} catch (e) {}

const TIER_COLORS: Record<string, string> = {
  Common: '#b0b0b0',
  Uncommon: '#2ecc71',
  Rare: '#3498db',
  Elite: '#e67e22',
  Epic: '#9b59b6',
  Legendary: '#f1c40f',
  Divine: '#00e5ff'
};

const TIER_EMOJIS: Record<string, string> = {
  Common: '📦',
  Uncommon: '🟢',
  Rare: '🔵',
  Elite: '🟠',
  Epic: '🟣',
  Legendary: '⭐',
  Divine: '💎'
};

export interface ChestsPageConfig {
  maxSlots: number;
  divinePity: number;
  pityThreshold: number;
  totalOpened: number;
}

export async function build(
  chests: IChestSlot[],
  config: ChestsPageConfig
): Promise<Buffer> {
  const slotW = 160;
  const slotH = 200;
  const cols = 4;
  const rows = Math.ceil(config.maxSlots / cols);
  const padding = 30;
  const gap = 15;
  const headerH = 100;
  const canvasW = padding * 2 + cols * slotW + (cols - 1) * gap;
  const canvasH = headerH + rows * (slotH + gap) + 60;

  const canvas = createCanvas(canvasW, canvasH);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Header gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 100);
  grad.addColorStop(0, '#1a1a1a');
  grad.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, 100);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🎁', padding, 45);
  ctx.fillText('CHEST VAULT', padding + 42, 45);

  // Stats line
  ctx.fillStyle = '#6b7280';
  ctx.font = '11px sans-serif';
  ctx.fillText(
    `${chests.length} / ${config.maxSlots} slots  •  ${config.totalOpened} opened`,
    padding,
    70
  );

  // Pity progress
  ctx.textAlign = 'right';
  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(
    `Divine Pity: ${config.divinePity}/${config.pityThreshold}`,
    canvas.width - padding,
    40
  );

  // Pity bar
  const pityBarX = canvas.width - padding - 200;
  const pityBarY = 52;
  const pityBarW = 200;
  const pityPct = Math.min(1, config.divinePity / config.pityThreshold);

  ctx.fillStyle = '#ffffff10';
  ctx.beginPath();
  ctx.roundRect(pityBarX, pityBarY, pityBarW, 8, 4);
  ctx.fill();

  if (pityPct > 0) {
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.roundRect(pityBarX, pityBarY, pityBarW * pityPct, 8, 4);
    ctx.fill();
  }

  // Divider
  ctx.beginPath();
  ctx.moveTo(padding, 85);
  ctx.lineTo(canvas.width - padding, 85);
  ctx.strokeStyle = '#ffffff1a';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Chest Slots
  for (let i = 0; i < config.maxSlots; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = padding + col * (slotW + gap);
    const y = headerH + row * (slotH + gap);

    const chest = chests[i];

    // Slot background
    ctx.fillStyle = chest ? '#ffffff08' : '#ffffff03';
    ctx.beginPath();
    ctx.roundRect(x, y, slotW, slotH, 12);
    ctx.fill();

    if (!chest) {
      // Empty slot
      ctx.strokeStyle = '#ffffff0a';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff15';
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', x + slotW / 2, y + slotH / 2 + 12);
      continue;
    }

    const color = TIER_COLORS[chest.tier] || '#ffffff';
    const emoji = chest.emoji || TIER_EMOJIS[chest.tier] || '📦';

    // Border glow based on status
    if (chest.status === 'ready') {
      ctx.strokeStyle = `${color}88`;
      ctx.lineWidth = 2;
    } else if (chest.status === 'unlocking') {
      ctx.strokeStyle = `${color}44`;
      ctx.lineWidth = 1;
    } else {
      ctx.strokeStyle = '#ffffff15';
      ctx.lineWidth = 1;
    }
    ctx.stroke();

    // Chest emoji
    ctx.font = '50px "NotoEmoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = chest.status === 'locked' ? 0.5 : 1;
    ctx.fillText(emoji, x + slotW / 2, y + 75);
    ctx.globalAlpha = 1;

    // Tier name
    ctx.fillStyle = color;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(chest.tier, x + slotW / 2, y + 110);

    // Status
    ctx.font = 'bold 10px sans-serif';
    if (chest.status === 'ready') {
      ctx.fillStyle = '#34d399';
      ctx.fillText('✓ READY TO OPEN', x + slotW / 2, y + 135);
    } else if (chest.status === 'unlocking') {
      const remainSec = Math.max(0, Math.floor(chest.remainingMs / 1000));
      const h = Math.floor(remainSec / 3600);
      const m = Math.floor(remainSec % 3600 / 60);
      const s = remainSec % 60;
      const timeStr =
        h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;

      ctx.fillStyle = '#eab308';
      ctx.fillText(`⏳ ${timeStr}`, x + slotW / 2, y + 135);

      // Unlock progress bar
      const totalSec = chest.unlockSeconds;
      const elapsed = totalSec - remainSec;
      const pct = Math.min(1, elapsed / totalSec);

      ctx.fillStyle = '#ffffff10';
      ctx.beginPath();
      ctx.roundRect(x + 20, y + 148, slotW - 40, 6, 3);
      ctx.fill();

      if (pct > 0) {
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.roundRect(x + 20, y + 148, (slotW - 40) * pct, 6, 3);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#6b7280';
      ctx.fillText('🔒 LOCKED', x + slotW / 2, y + 135);
    }

    // Slot number
    ctx.fillStyle = '#4b5563';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`#${i + 1}`, x + slotW - 10, y + slotH - 10);
  }

  return canvas.toBuffer('image/png');
}
