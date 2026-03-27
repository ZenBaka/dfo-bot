import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { join } from 'path';
import type { ITaskJSON } from '../interfaces/IGameJSON';

try {
  GlobalFonts.registerFromPath(
    join(process.cwd(), 'assets', 'NotoColorEmoji-Regular.ttf'),
    'NotoEmoji'
  );
} catch (e) {}

const PERIOD_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  daily: { bg: '#064e3b33', border: '#10b98144', text: '#34d399' },
  weekly: { bg: '#1e1b4b33', border: '#6366f144', text: '#818cf8' },
  monthly: { bg: '#4a044e33', border: '#c026d344', text: '#e879f9' }
};

export interface TasksPageConfig {
  period: string;
  resetIn: number; // ms until reset
  playerEmbers: number;
}

export async function build(
  tasks: ITaskJSON[],
  config: TasksPageConfig
): Promise<Buffer> {
  const rowH = 90;
  const headerH = 100;
  const footerH = 40;
  const canvasH = headerH + tasks.length * rowH + footerH + 20;
  const canvas = createCanvas(800, Math.max(300, canvasH));
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
  ctx.fillText('📋', 30, 45);
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('TASK BOARD', 70, 45);

  // Period badge
  const pc = PERIOD_COLORS[config.period] || PERIOD_COLORS.daily;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'right';
  const periodText = config.period.toUpperCase();
  const pw = ctx.measureText(periodText).width + 20;
  ctx.fillStyle = pc.bg;
  ctx.strokeStyle = pc.border;
  ctx.beginPath();
  ctx.roundRect(canvas.width - 30 - pw, 25, pw, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = pc.text;
  ctx.textAlign = 'center';
  ctx.fillText(periodText, canvas.width - 30 - pw / 2, 44);

  // Reset timer
  const resetMin = Math.floor(config.resetIn / 60000);
  const resetH = Math.floor(resetMin / 60);
  const resetStr = resetH > 0 ? `${resetH}h ${resetMin % 60}m` : `${resetMin}m`;
  ctx.fillStyle = '#6b7280';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`RESETS IN: ${resetStr}`, canvas.width - 30, 70);

  // Embers display
  ctx.fillStyle = '#f97316';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`🔥 ${config.playerEmbers.toLocaleString()} EMBERS`, 30, 70);

  // Divider
  ctx.beginPath();
  ctx.moveTo(30, 85);
  ctx.lineTo(canvas.width - 30, 85);
  ctx.strokeStyle = '#ffffff1a';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Task rows
  let y = headerH;

  for (const task of tasks) {
    const pct = Math.min(100, Math.floor(task.progress / task.target * 100));
    const isComplete = task.progress >= task.target;
    const isClaimed = task.claimed;

    // Row background
    ctx.fillStyle = isClaimed
      ? '#00000020'
      : isComplete
        ? '#064e3b22'
        : '#ffffff06';
    ctx.beginPath();
    ctx.roundRect(30, y, canvas.width - 60, rowH - 10, 10);
    ctx.fill();
    ctx.strokeStyle = isClaimed
      ? '#ffffff0a'
      : isComplete
        ? '#10b98133'
        : '#ffffff10';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Icon
    ctx.font = '24px "NotoEmoji", sans-serif';
    ctx.textAlign = 'left';
    ctx.globalAlpha = isClaimed ? 0.3 : 1;
    ctx.fillText(task.icon || '📋', 50, y + 35);

    // Description
    ctx.font = isClaimed ? 'italic 14px sans-serif' : 'bold 14px sans-serif';
    ctx.fillStyle = isClaimed ? '#6b7280' : '#ffffff';
    ctx.fillText(task.label, 90, y + 30, 400);

    // Progress text
    ctx.font = '11px monospace';
    ctx.fillStyle = isComplete ? '#34d399' : '#9ca3af';
    ctx.fillText(
      `${task.progress.toLocaleString()} / ${task.target.toLocaleString()}`,
      90,
      y + 50
    );

    // Progress bar
    const barX = 90;
    const barY = y + 58;
    const barW = 350;
    const barH = 8;

    ctx.fillStyle = '#ffffff10';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 4);
    ctx.fill();

    if (pct > 0) {
      ctx.fillStyle = isClaimed
        ? '#4b5563'
        : isComplete
          ? '#10b981'
          : '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * (pct / 100), barH, 4);
      ctx.fill();
    }

    // Percentage
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = isComplete ? '#34d399' : '#6b7280';
    ctx.textAlign = 'left';
    ctx.fillText(`${pct}%`, barX + barW + 10, barY + 8);

    // Rewards (right side)
    ctx.textAlign = 'right';
    const rewardX = canvas.width - 50;

    if (isClaimed) {
      ctx.fillStyle = '#4b5563';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('CLAIMED ✓', rewardX, y + 40);
    } else {
      ctx.fillStyle = '#eab308';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`${task.reward.gold.toLocaleString()}g`, rewardX, y + 25);

      ctx.fillStyle = '#60a5fa';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${task.reward.xp.toLocaleString()} XP`, rewardX, y + 42);

      if (task.reward.embers > 0) {
        ctx.fillStyle = '#f97316';
        ctx.fillText(`${task.reward.embers} 🔥`, rewardX, y + 57);
      }
    }

    ctx.globalAlpha = 1;
    y += rowH;
  }

  if (tasks.length === 0) {
    ctx.fillStyle = '#6b7280';
    ctx.font = 'italic 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      'No tasks available for this period.',
      canvas.width / 2,
      headerH + 50
    );
  }

  return canvas.toBuffer('image/png');
}
