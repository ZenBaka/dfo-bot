import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { type IStepJSON } from '../interfaces/IStepJSON';
import { type ICombatJSON } from '../interfaces/ICombatJSON';
import { join } from 'path';

// Load OS-agnostic emoji font
try {
  GlobalFonts.registerFromPath(
    join(process.cwd(), 'assets', 'NotoColorEmoji-Regular.ttf'),
    'NotoEmoji'
  );
} catch (e) {}

// Fully Upgraded Discord Markdown & Layout Engine
function processText(
  ctx: any,
  text: string,
  startX: number,
  startY: number,
  maxWidth: number,
  baseLineHeight: number,
  defaultColor: string,
  draw: boolean
): number {
  const lines = text.split('\n');
  let currentY = startY;

  for (let line of lines) {
    // 1. Block-Level Modifiers (Headers, Quotes, Lists, Subtext)
    let isQuote = false;
    let isSubtext = false;
    let headerLevel = 0;
    let listPrefix = '';
    let lineIndent = 0;

    if (line.startsWith('>>> ')) {
      isQuote = true;
      line = line.substring(4);
    } else if (line.startsWith('> ')) {
      isQuote = true;
      line = line.substring(2);
    }

    if (line.startsWith('-# ')) {
      isSubtext = true;
      line = line.substring(3);
    } else if (line.startsWith('### ')) {
      headerLevel = 3;
      line = line.substring(4);
    } else if (line.startsWith('## ')) {
      headerLevel = 2;
      line = line.substring(3);
    } else if (line.startsWith('# ')) {
      headerLevel = 1;
      line = line.substring(2);
    }

    const listMatch = line.match(/^(\s*[-*+]\s|\s*\d+\.\s)/);
    if (listMatch) {
      listPrefix = listMatch[0].trim();
      line = line.substring(listMatch[0].length);
      lineIndent = 25; // Push list items inward
    }

    if (isQuote) lineIndent = 20;

    // 2. Inline Markdown to Pseudo-HTML conversion
    const parsedLine = line
      .replace(/\|\|([^|]+)\|\|/g, '$1') // Strip Spoilers
      .replace(/<@!?\d+>/g, '<col=#3b82f6>@User</col>') // Format Mentions
      .replace(/\*\*\*(.+?)\*\*\*/g, '<bi>$1</bi>') // Bold Italic
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') // Bold
      .replace(/\*(.+?)\*/g, '<i>$1</i>') // Italic
      .replace(/__(.+?)__/g, '<u>$1</u>') // Underline
      .replace(/~~(.+?)~~/g, '<s>$1</s>') // Strikethrough
      .replace(/`([^`]+)`/g, '<c>$1</c>') // Inline Code
      .replace(
        /\[([^\]]+)\]\(color:(#[0-9a-fA-F]{3,6})\)/g,
        '<col=$2>$1</col>'
      ); // Hex Colors

    // 3. Tokenize by our custom tags
    const tokens = parsedLine
      .split(
        /(<bi>|<\/bi>|<b>|<\/b>|<i>|<\/i>|<u>|<\/u>|<s>|<\/s>|<c>|<\/c>|<col=#[0-9a-fA-F]+>|<\/col>)/g
      )
      .filter(Boolean);

    const currentState = {
      bold: headerLevel > 0,
      italic: isQuote || isSubtext,
      underline: false,
      strike: false,
      code: false,
      color: isSubtext ? '#6b7280' : isQuote ? '#9ca3af' : defaultColor
    };

    const wordObjects: { word: string; state: any }[] = [];

    // Inject the bullet point/number if it's a list
    if (listPrefix) {
      wordObjects.push({
        word: `${listPrefix} `,
        state: { ...currentState, color: '#10b981', bold: true }
      });
    }

    // Apply state toggles and chunk text into words
    for (const token of tokens) {
      if (token === '<bi>') {
        currentState.bold = true;
        currentState.italic = true;
      } else if (token === '</bi>') {
        currentState.bold = false;
        currentState.italic = false;
      } else if (token === '<b>') currentState.bold = true;
      else if (token === '</b>') currentState.bold = false;
      else if (token === '<i>') currentState.italic = true;
      else if (token === '</i>') currentState.italic = false;
      else if (token === '<u>') currentState.underline = true;
      else if (token === '</u>') currentState.underline = false;
      else if (token === '<s>') currentState.strike = true;
      else if (token === '</s>') currentState.strike = false;
      else if (token === '<c>') {
        currentState.code = true;
        currentState.color = '#6ee7b7';
      } else if (token === '</c>') {
        currentState.code = false;
        currentState.color = isSubtext
          ? '#6b7280'
          : isQuote
            ? '#9ca3af'
            : defaultColor;
      } else if (token.startsWith('<col=')) {
        currentState.color = token.substring(5, token.length - 1);
      } else if (token === '</col>') {
        currentState.color = isSubtext
          ? '#6b7280'
          : isQuote
            ? '#9ca3af'
            : defaultColor;
      } else {
        const textWords = token.split(' ');
        for (let w = 0; w < textWords.length; w++) {
          const wordStr = textWords[w] + (w < textWords.length - 1 ? ' ' : '');
          if (wordStr.length > 0) {
            wordObjects.push({ word: wordStr, state: { ...currentState } });
          }
        }
      }
    }

    const getFont = (state: any): string => {
      const weight = state.bold ? 'bold ' : '';
      const style = state.italic ? 'italic ' : '';
      let size = 22; // Base size

      if (headerLevel === 1) size = 32;
      else if (headerLevel === 2) size = 28;
      else if (headerLevel === 3) size = 24;
      else if (isSubtext) size = 16;
      else if (state.code) size = 20;

      let family = state.code ? 'monospace' : 'sans-serif';
      if (!state.code && !headerLevel && !isSubtext) family = 'monospace';

      return `${style}${weight}${size}px ${family}`;
    };

    let lineWords: any[] = [];
    let currentLineWidth = 0;
    const startYOfParagraph = currentY;

    let increment = baseLineHeight;
    if (headerLevel === 1) increment = 44;
    else if (headerLevel === 2) increment = 38;
    else if (headerLevel === 3) increment = 32;
    else if (isSubtext) increment = 22;

    if (wordObjects.length === 0) {
      currentY += baseLineHeight;
      continue;
    }

    // Draws a full wrapped line to the canvas
    const flushLine = (): void => {
      if (lineWords.length === 0) return;

      if (draw) {
        let drawX = startX + lineIndent;
        for (const lw of lineWords) {
          ctx.font = getFont(lw.state);
          ctx.fillStyle = lw.state.color;

          const m = ctx.measureText(lw.word);

          if (lw.state.code) {
            ctx.fillStyle = '#ffffff1a';
            ctx.fillRect(drawX, currentY - increment * 0.7, m.width, increment);
            ctx.fillStyle = lw.state.color;
          }

          ctx.fillText(lw.word, drawX, currentY);

          // Underlines and Strikethroughs
          if (lw.state.underline) {
            ctx.fillRect(
              drawX,
              currentY + 4,
              m.width - (lw.word.endsWith(' ') ? 8 : 0),
              2
            );
          }
          if (lw.state.strike) {
            ctx.fillRect(
              drawX,
              currentY - increment * 0.3,
              m.width - (lw.word.endsWith(' ') ? 8 : 0),
              2
            );
          }

          drawX += m.width;
        }
      }
      currentY += increment;
      lineWords = [];
      currentLineWidth = 0;
    };

    // Measure & Wrap loop
    for (const wObj of wordObjects) {
      ctx.font = getFont(wObj.state);
      let metrics = ctx.measureText(wObj.word);

      if (
        currentLineWidth + metrics.width > maxWidth - lineIndent &&
        lineWords.length > 0
      ) {
        flushLine();
        // Strip leading space on wrap
        if (wObj.word.startsWith(' ')) {
          wObj.word = wObj.word.substring(1);
          metrics = ctx.measureText(wObj.word);
        }
      }

      lineWords.push(wObj);
      currentLineWidth += metrics.width;
    }

    flushLine();

    // Draw Block Quote bar across the entire paragraph block
    if (isQuote && draw) {
      ctx.fillStyle = '#10b98180';
      ctx.fillRect(
        startX,
        startYOfParagraph - increment * 0.7,
        4,
        currentY - startYOfParagraph
      );
    }

    if (headerLevel > 0) currentY += 10;
    else currentY += baseLineHeight * 0.3; // Paragraph margin
  }

  return currentY - startY;
}

export async function build(data: IStepJSON | ICombatJSON): Promise<Buffer> {
  // --- NORMALIZE DATA PAYLOADS ---
  const flavorText = data.flavorText || 'Waiting for input...';
  const enemyStats = data.enemy;

  const scenarioMeta = {
    id: (data as IStepJSON).scenarioId || '0',
    author: (data as IStepJSON).scenarioAuthor || 'SYSTEM'
  };

  const pStats = data.playerStats || {};
  const level = pStats.level ?? 1;
  const mappedStats = {
    hp: Math.floor(pStats.stats?.hp ?? pStats.hp ?? 0),
    maxHp: pStats.maxHp ?? 100,
    level,
    exp: Math.floor(pStats.experience ?? pStats.exp ?? 0),
    gold: pStats.coins ?? pStats.gold ?? 0,
    expRequired:
      pStats.expRequired ?? Math.floor(50 * Math.max(1, level) ** 1.3),
    activeBonuses: pStats.activeBonuses || {}
  };

  const inCombat = !!enemyStats;
  const isDead = mappedStats.hp <= 0;

  const b = mappedStats.activeBonuses;
  const hasBonuses =
    b && (b.critChance > 5 || b.lifeSteal > 0 || b.dodge > 0 || b.thorns > 0);

  // --- PRE-CALCULATE TEXT HEIGHT ---
  const dummyCanvas = createCanvas(800, 10);
  const dummyCtx = dummyCanvas.getContext('2d');
  const termW = 720;

  // Measure without drawing
  const requiredTextHeight = processText(
    dummyCtx,
    flavorText,
    0,
    0,
    termW - 60,
    32,
    '#ffffff',
    false
  );

  let extraHeight = 0;
  const baseTextSpace = 160;
  if (requiredTextHeight > baseTextSpace) {
    extraHeight = requiredTextHeight - baseTextSpace + 20; // Stretch canvas
  }

  // --- DYNAMIC CANVAS SIZING ---
  let canvasHeight = 560 + extraHeight;
  if (inCombat) canvasHeight += 75;
  if (hasBonuses) canvasHeight += 40;

  const canvas = createCanvas(800, canvasHeight);
  const ctx = canvas.getContext('2d');

  const themeColor = inCombat || isDead ? '#ef4444' : '#10b981';
  const themeColorDim = inCombat || isDead ? '#ef444433' : '#10b98133';

  // 1. Background
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

  // 2. Header
  ctx.fillStyle = themeColor;
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  const headerText = isDead
    ? 'SYSTEM FAILURE'
    : inCombat
      ? 'COMBAT ENGAGED'
      : 'ADVENTURE';
  ctx.fillText(headerText, canvas.width / 2, 60);

  // 3. Terminal Window
  const termX = 40;
  const termY = 90;
  const termH = 280 + extraHeight; // Stretched dynamically

  ctx.fillStyle = '#000000cc';
  ctx.beginPath();
  ctx.roundRect(termX, termY, termW, termH, 12);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = themeColorDim;
  ctx.stroke();

  ctx.fillStyle = '#ffffff0a';
  ctx.beginPath();
  ctx.roundRect(termX, termY, termW, 30, [12, 12, 0, 0]);
  ctx.fill();

  const dotY = termY + 15;
  ctx.fillStyle = isDead ? '#dc2626' : '#ef4444';
  ctx.beginPath();
  ctx.arc(termX + 20, dotY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(termX + 40, dotY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(termX + 60, dotY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#6b7280';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(
    inCombat
      ? 'combat_protocol.exe'
      : isDead
        ? 'system_dump.log'
        : 'adventure_logs.sh',
    termX + 80,
    termY + 20
  );

  ctx.fillStyle = '#ffffff0a';
  ctx.fillRect(termX, termY + termH - 25, termW, 25);
  ctx.fillStyle = '#4b5563';
  ctx.font = '10px monospace';
  ctx.fillText(
    `ID: ${scenarioMeta.id.toString().padStart(6, '0')}`,
    termX + 15,
    termY + termH - 8
  );
  ctx.textAlign = 'right';
  ctx.fillText(
    `Author: ${scenarioMeta.author}`,
    termX + termW - 15,
    termY + termH - 8
  );

  const textColor = isDead ? '#fca5a5' : inCombat ? '#fca5a5' : themeColor;
  ctx.fillStyle = textColor;
  ctx.font = '22px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('>', termX + 20, termY + 60);

  // Execute the final drawing with markdown support!
  processText(
    ctx,
    flavorText,
    termX + 40,
    termY + 60,
    termW - 60,
    32,
    textColor,
    true
  );

  let yOffset = termY + termH + 25;

  // 4. Enemy Stats
  if (inCombat && enemyStats && !isDead) {
    ctx.fillStyle = '#450a0a';
    ctx.strokeStyle = '#ef44444d';
    ctx.beginPath();
    ctx.roundRect(termX, yOffset, 60, 45, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ef4444b3';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ATK', termX + 30, yOffset + 18);
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(enemyStats.atk.toString(), termX + 30, yOffset + 38);

    ctx.fillStyle = '#172554';
    ctx.strokeStyle = '#3b82f64d';
    ctx.beginPath();
    ctx.roundRect(termX + termW - 60, yOffset, 60, 45, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3b82f6b3';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DEF', termX + termW - 30, yOffset + 18);
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(enemyStats.def.toString(), termX + termW - 30, yOffset + 38);

    const eBarX = termX + 75;
    const eBarW = termW - 150;
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(enemyStats.name, eBarX, yOffset + 15);
    ctx.textAlign = 'right';
    ctx.fillText(
      `${Math.max(0, enemyStats.currentHp)} / ${enemyStats.maxHp} HP`,
      eBarX + eBarW,
      yOffset + 15
    );

    ctx.fillStyle = '#ffffff1a';
    ctx.beginPath();
    ctx.roundRect(eBarX, yOffset + 25, eBarW, 12, 6);
    ctx.fill();
    const eHpPercent = Math.max(
      0,
      Math.min(enemyStats.currentHp / enemyStats.maxHp, 1)
    );
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(eBarX, yOffset + 25, eBarW * eHpPercent, 12, 6);
    ctx.fill();

    yOffset += 75;
  }

  // 5. Player Stats
  const hpPercent = Math.max(
    0,
    Math.min(mappedStats.hp / mappedStats.maxHp, 1)
  );
  const expPercent = Math.max(
    0,
    Math.min(mappedStats.exp / mappedStats.expRequired, 1)
  );

  ctx.fillStyle = isDead ? '#ef4444' : '#34d399';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Player HP', termX, yOffset);
  ctx.textAlign = 'right';
  ctx.fillText(
    `${mappedStats.hp} / ${mappedStats.maxHp}`,
    termX + termW,
    yOffset
  );

  ctx.fillStyle = '#ffffff1a';
  ctx.beginPath();
  ctx.roundRect(termX, yOffset + 12, termW, 12, 6);
  ctx.fill();
  ctx.fillStyle = isDead ? '#dc2626' : '#10b981';
  ctx.beginPath();
  ctx.roundRect(termX, yOffset + 12, termW * hpPercent, 12, 6);
  ctx.fill();

  yOffset += 45;

  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Level ${mappedStats.level}`, termX, yOffset);
  ctx.fillStyle = '#6b7280';
  ctx.textAlign = 'right';
  ctx.fillText(
    `${mappedStats.exp} / ${mappedStats.expRequired} XP`,
    termX + termW,
    yOffset
  );

  ctx.fillStyle = '#ffffff1a';
  ctx.beginPath();
  ctx.roundRect(termX, yOffset + 12, termW, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.roundRect(termX, yOffset + 12, termW * expPercent, 12, 6);
  ctx.fill();

  yOffset += 40;

  // 6. Active Bonuses
  if (hasBonuses) {
    let pillX = termX;

    const drawBonusPill = (
      label: string,
      value: string,
      bgColor: string,
      borderColor: string,
      textColor: string
    ): void => {
      ctx.font = 'bold 10px sans-serif';
      const text = `${label}: ${value}`;
      const textWidth = ctx.measureText(text).width;

      ctx.fillStyle = bgColor;
      ctx.strokeStyle = borderColor;
      ctx.beginPath();
      ctx.roundRect(pillX, yOffset, textWidth + 16, 20, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.fillText(text, pillX + (textWidth + 16) / 2, yOffset + 14);

      pillX += textWidth + 24;
    };

    if (b.critChance > 5)
      drawBonusPill(
        'Crit',
        `${b.critChance}%`,
        '#713f1233',
        '#eab30833',
        '#facc15'
      );
    if (b.lifeSteal > 0)
      drawBonusPill(
        'Vamp',
        `${b.lifeSteal}%`,
        '#450a0a33',
        '#ef444433',
        '#f87171'
      );
    if (b.dodge > 0)
      drawBonusPill(
        'Dodge',
        `${b.dodge}%`,
        '#17255433',
        '#3b82f633',
        '#93c5fd'
      );
    if (b.thorns > 0)
      drawBonusPill(
        'Thorns',
        `${b.thorns}`,
        '#7c2d1233',
        '#f9731633',
        '#fb923c'
      );

    yOffset += 35;
  }

  // 7. Footer (Gold)
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'left';
  ctx.font = '16px "NotoEmoji", sans-serif';
  ctx.fillText('🪙', termX, yOffset + 15);

  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(
    ` GOLD   ${mappedStats.gold.toLocaleString()}`,
    termX + 22,
    yOffset + 15
  );

  // 8. TOAST NOTIFICATIONS (Rewards)
  const rewards = (data as any).rewards;
  if (rewards) {
    const toasts: { msg: string; color: string; icon: string }[] = [];

    if (rewards.xp)
      toasts.push({ msg: `+${rewards.xp} XP`, color: '#3b82f6', icon: '✨' });
    if (rewards.gold)
      toasts.push({
        msg: `+${rewards.gold} Gold`,
        color: '#eab308',
        icon: '🪙'
      });
    if (rewards.levelsGained > 0)
      toasts.push({ msg: 'LEVEL UP!', color: '#10b981', icon: '🆙' });
    if (rewards.item) {
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
      const itemColor = RARITY_COLORS[rewards.item.rarity] || '#ffffff';
      toasts.push({ msg: rewards.item.name, color: itemColor, icon: '🎒' });
    }

    let toastY = 30;
    for (const toast of toasts) {
      ctx.font = 'bold 14px sans-serif';
      const msgWidth = ctx.measureText(toast.msg).width;
      const toastW = msgWidth + 60;
      const toastH = 40;

      ctx.fillStyle = '#0a0a0ae6';
      ctx.beginPath();
      ctx.roundRect(0, toastY, toastW, toastH, [0, 8, 8, 0]);
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.strokeStyle = `${toast.color}40`;
      ctx.stroke();

      ctx.fillStyle = toast.color;
      ctx.fillRect(0, toastY, 4, toastH);

      ctx.font = '16px "NotoEmoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(toast.icon, 24, toastY + 26);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(toast.msg, 44, toastY + 25);

      toastY += toastH + 10;
    }
  }

  return canvas.toBuffer('image/png');
}
