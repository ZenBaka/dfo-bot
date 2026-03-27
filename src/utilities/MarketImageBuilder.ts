import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
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
  if (item.slot && item.slot !== 'None' && SLOT_ICONS[item.slot])
    return SLOT_ICONS[item.slot];
  return CATEGORY_ICONS[item.type] || '📦';
}

export interface MarketListing {
  listingId: string;
  sellerName: string;
  quantity: number;
  pricePerUnit: number;
  item: {
    itemId: number;
    name: string;
    rarity: string;
    type: string;
    slot: string;
    level: number;
    stats: { atk: number; def: number; hp: number };
  };
}

export interface MarketPageConfig {
  page: number;
  totalPages: number;
  totalItems: number;
  mode: 'browse' | 'my_listings';
}

const ROW_HEIGHT = 72;
const HEADER_HEIGHT = 95;
const FOOTER_HEIGHT = 45;
const PADDING = 30;
const CANVAS_WIDTH = 850;

export async function build(
  listings: MarketListing[],
  config: MarketPageConfig
): Promise<Buffer> {
  const rowCount = listings.length;
  const canvasHeight =
    HEADER_HEIGHT +
    Math.max(rowCount, 1) * ROW_HEIGHT +
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

  const accentColor = config.mode === 'my_listings' ? '#3b82f6' : '#10b981';
  const headerGrad = ctx.createLinearGradient(0, 0, 0, HEADER_HEIGHT);
  headerGrad.addColorStop(0, `${accentColor}25`);
  headerGrad.addColorStop(1, '#0a0a0a00');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, canvas.width, HEADER_HEIGHT);

  // --- Header (text only, no emoji overlap) ---
  ctx.textAlign = 'center';
  ctx.fillStyle = accentColor;
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(
    config.mode === 'my_listings' ? 'My Listings' : 'Global Market',
    canvas.width / 2,
    42
  );

  ctx.fillStyle = '#6b7280';
  ctx.font = '13px sans-serif';
  ctx.fillText(
    `${config.totalItems.toLocaleString()} listing${config.totalItems !== 1 ? 's' : ''} — Page ${config.page} of ${Math.max(1, config.totalPages)}`,
    canvas.width / 2,
    68
  );

  // --- Empty state ---
  const startY = HEADER_HEIGHT;

  if (rowCount === 0) {
    ctx.fillStyle = '#4b5563';
    ctx.font = 'italic 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      config.mode === 'my_listings'
        ? 'You have no active listings.'
        : 'No listings found.',
      canvas.width / 2,
      startY + 36
    );
  }

  // --- Listing rows ---
  for (let i = 0; i < rowCount; i++) {
    const listing = listings[i];
    const item = listing.item;
    const rowY = startY + i * ROW_HEIGHT;
    const rarityColor = RARITY_COLORS[item.rarity] || '#ffffff';
    const displayIndex = i + 1;

    // Row bg
    ctx.fillStyle = i % 2 === 0 ? '#ffffff06' : '#00000000';
    ctx.beginPath();
    ctx.roundRect(PADDING, rowY, contentWidth, ROW_HEIGHT - 4, 8);
    ctx.fill();

    // Rarity accent bar
    ctx.fillStyle = rarityColor;
    ctx.beginPath();
    ctx.roundRect(PADDING, rowY, 4, ROW_HEIGHT - 4, [4, 0, 0, 4]);
    ctx.fill();

    // --- Number badge ---
    ctx.fillStyle = '#ffffff12';
    ctx.beginPath();
    ctx.roundRect(PADDING + 14, rowY + 18, 32, 32, 6);
    ctx.fill();

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${displayIndex}`, PADDING + 30, rowY + 40);

    // Item icon
    ctx.font = '22px "NotoEmoji", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(getItemIcon(item), PADDING + 70, rowY + 42);

    // Item name
    ctx.textAlign = 'left';
    ctx.fillStyle = rarityColor;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(item.name, PADDING + 95, rowY + 28, 300);

    // Meta line
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    let meta = `${item.rarity} ${item.type} • Lvl ${item.level}`;
    if (config.mode === 'browse') meta += ` • by ${listing.sellerName}`;
    ctx.fillText(meta, PADDING + 95, rowY + 46, 300);

    // Quantity pill
    const qtyText = `x${listing.quantity}`;
    ctx.font = 'bold 12px sans-serif';
    const qtyWidth = ctx.measureText(qtyText).width + 16;
    const qtyX = PADDING + contentWidth - 215;

    ctx.fillStyle = '#ffffff0f';
    ctx.beginPath();
    ctx.roundRect(qtyX, rowY + 20, qtyWidth, 22, 4);
    ctx.fill();

    ctx.fillStyle = '#d1d5db';
    ctx.textAlign = 'center';
    ctx.fillText(qtyText, qtyX + qtyWidth / 2, rowY + 35);

    // Price
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(
      `${listing.pricePerUnit.toLocaleString()}g`,
      PADDING + contentWidth - 12,
      rowY + 34
    );

    if (listing.quantity > 1) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px sans-serif';
      ctx.fillText(
        `Total: ${(listing.pricePerUnit * listing.quantity).toLocaleString()}g`,
        PADDING + contentWidth - 12,
        rowY + 52
      );
    }
  }

  // --- Footer ---
  const footerY = startY + Math.max(rowCount, 1) * ROW_HEIGHT + 12;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#374151';
  ctx.font = '11px sans-serif';
  ctx.fillText(
    '⚔️ DFO Cross-Platform Market — capi.gg',
    canvas.width / 2,
    footerY
  );

  return canvas.toBuffer('image/png');
}
