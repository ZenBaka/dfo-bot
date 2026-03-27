import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { join } from 'path';
import { ZONES, type ZoneInfo } from './ZoneData';

try {
  GlobalFonts.registerFromPath(
    join(process.cwd(), 'assets', 'NotoColorEmoji-Regular.ttf'),
    'NotoEmoji'
  );
} catch (e) {}

const RARITY_COLORS: Record<string, string> = {
  Uncommon: '#2ecc71',
  Rare: '#3498db',
  Elite: '#e67e22',
  Epic: '#9b59b6',
  Legendary: '#f1c40f',
  Divine: '#00e5ff'
};

const TIER_COLORS: Record<string, string> = {
  'The Apprentice': '#2ecc71',
  'The Adventurer': '#3498db',
  'The Hero': '#e67e22',
  'The Ascendant': '#9b59b6',
  'The Cosmic': '#00e5ff',
  Beyond: '#ff00cc'
};

const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 90;
const TIER_HEADER_HEIGHT = 36;
const FOOTER_HEIGHT = 40;
const PADDING = 30;
const CANVAS_WIDTH = 800;

export async function build(
  playerLevel: number,
  currentZoneId: number
): Promise<Buffer> {
  // Group zones by tier
  const tiers = new Map<string, ZoneInfo[]>();
  for (const zone of ZONES) {
    const tier = zone.tier;
    if (!tiers.has(tier)) tiers.set(tier, []);
    tiers.get(tier)!.push(zone);
  }

  // Calculate canvas height
  let totalRows = 0;
  let tierCount = 0;
  for (const zones of tiers.values()) {
    tierCount++;
    totalRows += zones.length;
  }

  const canvasHeight =
    HEADER_HEIGHT +
    tierCount * TIER_HEADER_HEIGHT +
    totalRows * ROW_HEIGHT +
    FOOTER_HEIGHT +
    PADDING;

  const canvas = createCanvas(CANVAS_WIDTH, canvasHeight);
  const ctx = canvas.getContext('2d');
  const contentWidth = CANVAS_WIDTH - PADDING * 2;

  // --- Background ---
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#ffffff05';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.height; i += 20) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }

  // Header gradient
  const headerGrad = ctx.createLinearGradient(0, 0, 0, HEADER_HEIGHT);
  headerGrad.addColorStop(0, '#10b98125');
  headerGrad.addColorStop(1, '#0a0a0a00');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, canvas.width, HEADER_HEIGHT);

  // --- Header ---
  ctx.textAlign = 'center';
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('Zone Map', canvas.width / 2, 38);

  const currentZone = ZONES.find((z) => z.id === currentZoneId);
  ctx.fillStyle = '#6b7280';
  ctx.font = '13px sans-serif';
  ctx.fillText(
    `Current: ${currentZone?.name ?? 'Unknown'} • Level ${playerLevel}`,
    canvas.width / 2,
    62
  );

  // --- Zone rows grouped by tier ---
  let y = HEADER_HEIGHT;

  for (const [tierName, zones] of tiers) {
    const tierColor = TIER_COLORS[tierName] || '#ffffff';

    // Tier header
    ctx.fillStyle = `${tierColor}15`;
    ctx.fillRect(PADDING, y, contentWidth, TIER_HEADER_HEIGHT - 2);

    ctx.fillStyle = tierColor;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(tierName.toUpperCase(), PADDING + 12, y + 22);

    y += TIER_HEADER_HEIGHT;

    // Zone rows
    for (const zone of zones) {
      const isCurrentZone = zone.id === currentZoneId;
      const isAccessible = playerLevel >= zone.levelReq;
      const rarityColor = RARITY_COLORS[zone.rarityCap] || '#6b7280';

      // Row bg
      if (isCurrentZone) {
        ctx.fillStyle = '#10b98118';
      } else {
        ctx.fillStyle = zone.id % 2 === 0 ? '#ffffff04' : '#00000000';
      }
      ctx.beginPath();
      ctx.roundRect(PADDING, y, contentWidth, ROW_HEIGHT - 2, 6);
      ctx.fill();

      // Current zone indicator
      if (isCurrentZone) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.roundRect(PADDING, y, 4, ROW_HEIGHT - 2, [4, 0, 0, 4]);
        ctx.fill();

        ctx.font = '14px "NotoEmoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📍', PADDING + 22, y + 33);
      }

      const textX = isCurrentZone ? PADDING + 42 : PADDING + 16;

      // Zone name
      ctx.textAlign = 'left';
      ctx.fillStyle = isAccessible ? '#ffffff' : '#4b5563';
      ctx.font = `${isCurrentZone ? 'bold ' : ''}15px sans-serif`;
      ctx.fillText(
        `${isAccessible ? '' : '🔒 '}${zone.name}`,
        textX,
        y + 22,
        340
      );

      // Description
      ctx.fillStyle = isAccessible ? '#6b7280' : '#374151';
      ctx.font = '11px sans-serif';
      ctx.fillText(zone.description, textX, y + 38, 340);

      // Level req (right side)
      ctx.textAlign = 'right';
      ctx.fillStyle = isAccessible ? '#4b5563' : '#ef4444';
      ctx.font = '11px sans-serif';
      ctx.fillText(
        `Lvl ${zone.levelReq}+`,
        PADDING + contentWidth - 100,
        y + 22
      );

      // Rarity cap pill
      ctx.fillStyle = `${rarityColor}20`;
      ctx.font = '10px sans-serif';
      const pillText = zone.rarityCap;
      const pillWidth = ctx.measureText(pillText).width + 14;
      const pillX = PADDING + contentWidth - pillWidth - 8;

      ctx.beginPath();
      ctx.roundRect(pillX, y + 28, pillWidth, 16, 3);
      ctx.fill();

      ctx.fillStyle = isAccessible ? rarityColor : '#4b5563';
      ctx.textAlign = 'center';
      ctx.fillText(pillText, pillX + pillWidth / 2, y + 40);

      y += ROW_HEIGHT;
    }
  }

  // --- Footer ---
  y += 10;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#374151';
  ctx.font = '11px sans-serif';
  ctx.fillText('⚔️ DFO Zone Map — capi.gg', canvas.width / 2, y);

  return canvas.toBuffer('image/png');
}
