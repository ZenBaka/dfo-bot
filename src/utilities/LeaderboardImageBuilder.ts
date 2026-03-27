import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { join } from 'path';

// Load emoji font
try {
  GlobalFonts.registerFromPath(
    join(process.cwd(), 'assets', 'NotoColorEmoji-Regular.ttf'),
    'NotoEmoji'
  );
} catch (e) {}

export interface LeaderboardEntry {
  username: string;
  value: number;
  level: number;
}

export interface LeaderboardConfig {
  title: string;
  stat: string;
  emoji: string;
  accentColor: string; // hex, e.g. '#eab308'
  accentColorDim: string; // hex with opacity, e.g. '#eab30833'
}

const MEDAL_COLORS = ['#fbbf24', '#c0c0c0', '#cd7f32']; // Gold, Silver, Bronze
const ROW_HEIGHT = 64;
const HEADER_HEIGHT = 120;
const FOOTER_HEIGHT = 50;
const PADDING = 40;
const CANVAS_WIDTH = 800;

export async function build(
  entries: LeaderboardEntry[],
  config: LeaderboardConfig
): Promise<Buffer> {
  const rowCount = Math.min(entries.length, 10);
  const canvasHeight =
    HEADER_HEIGHT + rowCount * ROW_HEIGHT + FOOTER_HEIGHT + PADDING;

  const canvas = createCanvas(CANVAS_WIDTH, canvasHeight);
  const ctx = canvas.getContext('2d');
  const contentWidth = CANVAS_WIDTH - PADDING * 2;

  // --- 1. Background ---
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle scanlines
  ctx.strokeStyle = '#ffffff05';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.height; i += 20) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }

  // Top accent gradient
  const headerGrad = ctx.createLinearGradient(0, 0, 0, HEADER_HEIGHT);
  headerGrad.addColorStop(0, config.accentColorDim);
  headerGrad.addColorStop(1, '#0a0a0a00');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, canvas.width, HEADER_HEIGHT);

  // --- 2. Header ---
  ctx.textAlign = 'center';

  // Emoji
  ctx.font = '32px "NotoEmoji", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(config.emoji, canvas.width / 2, 45);

  // Title
  ctx.fillStyle = config.accentColor;
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(config.title, canvas.width / 2, 82);

  // Subtitle
  ctx.fillStyle = '#6b7280';
  ctx.font = '14px sans-serif';
  ctx.fillText(
    `Top ${rowCount} Players — Ranked by ${config.stat}`,
    canvas.width / 2,
    105
  );

  // --- 3. Rows ---
  const startY = HEADER_HEIGHT + 10;

  for (let i = 0; i < rowCount; i++) {
    const entry = entries[i];
    const rowY = startY + i * ROW_HEIGHT;
    const isTop3 = i < 3;

    // Row background — alternating subtle stripes
    ctx.fillStyle = i % 2 === 0 ? '#ffffff06' : '#00000000';
    ctx.beginPath();
    ctx.roundRect(PADDING, rowY, contentWidth, ROW_HEIGHT - 4, 8);
    ctx.fill();

    // Top 3 get a colored left accent bar
    if (isTop3) {
      ctx.fillStyle = MEDAL_COLORS[i];
      ctx.beginPath();
      ctx.roundRect(PADDING, rowY, 4, ROW_HEIGHT - 4, [4, 0, 0, 4]);
      ctx.fill();
    }

    // Rank number
    const rankX = PADDING + 30;
    if (isTop3) {
      // Medal emoji for top 3
      const medals = ['🥇', '🥈', '🥉'];
      ctx.font = '24px "NotoEmoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(medals[i], rankX, rowY + 40);
    } else {
      ctx.fillStyle = '#4b5563';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, rankX, rowY + 40);
    }

    // Username
    ctx.textAlign = 'left';
    ctx.fillStyle = isTop3 ? '#ffffff' : '#d1d5db';
    ctx.font = `${isTop3 ? 'bold ' : ''}18px sans-serif`;
    ctx.fillText(entry.username, PADDING + 65, rowY + 34);

    // Level badge (small, under the name)
    ctx.fillStyle = '#374151';
    ctx.font = '11px sans-serif';
    ctx.fillText(`LVL ${entry.level}`, PADDING + 65, rowY + 52);

    // Stat value — right aligned
    ctx.textAlign = 'right';
    ctx.fillStyle = isTop3 ? config.accentColor : '#9ca3af';
    ctx.font = `bold ${isTop3 ? '22' : '18'}px monospace`;
    ctx.fillText(
      entry.value.toLocaleString(),
      PADDING + contentWidth - 15,
      rowY + 40
    );
  }

  // --- 4. Footer ---
  const footerY = startY + rowCount * ROW_HEIGHT + 15;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#374151';
  ctx.font = '11px sans-serif';
  ctx.fillText(
    '⚔️ DFO Cross-Platform Integration — capi.gg',
    canvas.width / 2,
    footerY
  );

  return canvas.toBuffer('image/png');
}
