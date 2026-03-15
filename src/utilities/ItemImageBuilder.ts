import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { IItemJSON } from '../interfaces/IItemJSON';
import { join } from 'path';

try { GlobalFonts.registerFromPath(join(process.cwd(), 'assets', 'NotoColorEmoji-Regular.ttf'), 'NotoEmoji'); } catch(e) {}

const RARITY_COLORS: Record<string, string> = {
    Common: '#b0b0b0', Uncommon: '#2ecc71', Rare: '#3498db',
    Elite: '#e67e22', Epic: '#9b59b6', Legendary: '#f1c40f',
    Divine: '#00e5ff', Exotic: '#ff00cc'
};

const SLOT_ICONS: Record<string, string> = {
    'Head': '⛑️', 'Necklace': '📿', 'Chest': '👕', 'MainHand': '⚔️',
    'Legs': '👖', 'OffHand': '🛡️', 'Hands': '🧤', 'RingA': '💍', 
    'RingB': '💍', 'Feet': '👢', 'Pet': '🐾', 'Special': '✨'
};

const CATEGORY_ICONS: Record<string, string> = {
    'Weapon': '⚔️', 'Armor': '🛡️', 'Accessory': '💍',
    'Consumable': '🧪', 'Material': '🪵', 'Collectible': '🗿'
};

function getItemIcon(item: IItemJSON) {
    if (item.slot && item.slot !== 'None' && SLOT_ICONS[item.slot]) return SLOT_ICONS[item.slot];
    return CATEGORY_ICONS[item.type] || '📦';
}

export default class ItemImageBuilder {
  public static async build(item: IItemJSON): Promise<Buffer> {
    const affixesCount = item.affixes?.length || 0;
    const enhanceLevel = (item as any).enhanceLevel || 0;
    const canvasHeight = affixesCount > 0 ? 430 + (affixesCount * 45) : 400;
    
    const canvas = createCanvas(600, canvasHeight);
    const ctx = canvas.getContext('2d');
    const color = RARITY_COLORS[item.rarity] || '#ffffff';

    // 1. Background & Rarity Glow
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 4;
    ctx.strokeStyle = `${color}44`;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    const bgGradient = ctx.createLinearGradient(0, 0, 0, 150);
    bgGradient.addColorStop(0, `${color}11`);
    bgGradient.addColorStop(1, '#0a0a0a00');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, 150);

    // 2. Icon & Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '60px "NotoEmoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(getItemIcon(item), canvas.width / 2, 85);

    // Item name with enhance level
    const displayName = enhanceLevel > 0 ? `${item.name} +${enhanceLevel}` : item.name;
    ctx.fillStyle = color;
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(displayName, canvas.width / 2, 135, 560);

    // 3. Badges (Rarity, Type, and Enhancement)
    ctx.font = 'bold 10px sans-serif';
    const rarityText = item.rarity.toUpperCase();
    let typeText = item.type.toUpperCase();
    if (item.slot && item.slot !== 'None') typeText += `  •  ${item.slot.toUpperCase()}`;

    const rWidth = ctx.measureText(rarityText).width + 20;
    const tWidth = ctx.measureText(typeText).width + 20;

    // Enhancement badge dimensions
    let enhText = '';
    let enhWidth = 0;
    if (enhanceLevel > 0) {
        enhText = `+${enhanceLevel} ENHANCED`;
        enhWidth = ctx.measureText(enhText).width + 20;
    }

    const totalBadgeWidth = rWidth + tWidth + (enhWidth > 0 ? enhWidth + 10 : 0) + 10;
    let currentX = (canvas.width - totalBadgeWidth) / 2;

    // Rarity Badge
    ctx.fillStyle = `${color}1a`;
    ctx.strokeStyle = `${color}66`;
    ctx.beginPath();
    ctx.roundRect(currentX, 155, rWidth, 24, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillText(rarityText, currentX + rWidth / 2, 171);

    currentX += rWidth + 10;

    // Type/Slot Badge
    ctx.fillStyle = '#ffffff0a';
    ctx.strokeStyle = '#ffffff20';
    ctx.beginPath();
    ctx.roundRect(currentX, 155, tWidth, 24, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(typeText, currentX + tWidth / 2, 171);

    // Enhancement Badge (amber)
    if (enhanceLevel > 0) {
        currentX += tWidth + 10;
        ctx.fillStyle = '#92400e44';   // amber-900/25
        ctx.strokeStyle = '#f59e0b66'; // amber-500/40
        ctx.beginPath();
        ctx.roundRect(currentX, 155, enhWidth, 24, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fbbf24'; // amber-400
        ctx.fillText(enhText, currentX + enhWidth / 2, 171);
    }

    // 4. Description
    ctx.fillStyle = '#9ca3af';
    ctx.font = 'italic 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`"${item.description}"`, canvas.width / 2, 220, 540);

    // 5. Stats or Consumable Effect
    let yOffset = 260;
    if (item.type === 'Consumable') {
        ctx.fillStyle = '#713f1233';
        ctx.strokeStyle = '#eab3084d';
        ctx.beginPath();
        ctx.roundRect(50, yOffset, 500, 70, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#eab308';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('EFFECT', canvas.width / 2, yOffset + 25);

        let effectText = 'Unknown Effect';
        let effectColor = '#ffffff';
        if (item.action?.effect === 'HEAL_HP') { effectText = `Restores ${item.action.amount} HP`; effectColor = '#4ade80'; }
        else if (item.action?.effect === 'GRANT_XP') { effectText = `Grants ${item.action.amount} XP`; effectColor = '#c084fc'; }
        else if (item.action?.effect === 'GRANT_GOLD') { effectText = `Grants ${item.action.amount} Gold`; effectColor = '#fbbf24'; }

        ctx.fillStyle = effectColor;
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(effectText, canvas.width / 2, yOffset + 50);

    } else if (item.stats) {
        const boxW = 150;
        const gap = 20;
        const statX = (canvas.width - ((boxW * 3) + (gap * 2))) / 2;

        const drawStatBox = (x: number, label: string, val: number, valColor: string) => {
            ctx.fillStyle = '#ffffff0a';
            ctx.strokeStyle = '#ffffff1a';
            ctx.beginPath();
            ctx.roundRect(x, yOffset, boxW, 70, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#6b7280';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + boxW / 2, yOffset + 25);

            ctx.fillStyle = valColor;
            ctx.font = 'bold 24px monospace';
            ctx.fillText(val.toString(), x + boxW / 2, yOffset + 55);
        };

        drawStatBox(statX, 'ATK', item.stats.atk || 0, '#f87171');
        drawStatBox(statX + boxW + gap, 'DEF', item.stats.def || 0, '#60a5fa');
        drawStatBox(statX + (boxW + gap) * 2, 'HP', item.stats.hp || 0, '#4ade80');
    }

    // 6. Affixes
    if (affixesCount > 0) {
        yOffset += 110;

        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SPECIAL EFFECTS', canvas.width / 2, yOffset);

        yOffset += 15;
        item.affixes!.forEach(affix => {
            ctx.fillStyle = '#581c8733';
            ctx.strokeStyle = '#a855f733';
            ctx.beginPath();
            ctx.roundRect(150, yOffset, 300, 32, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#e9d5ff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(affix.type.replace('_', ' '), 165, yOffset + 21);

            const valText = `+${affix.value}${affix.type === 'THORNS' ? '' : '%'}`;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(valText, 435, yOffset + 22);

            yOffset += 40;
        });
    }

    // 7. Footer
    ctx.fillStyle = '#4b5563';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    
    let footerText = `ID: ${item.itemId}`;
    if (item.level > 1) footerText += `  |  REQ LVL: ${item.level}`;
    
    ctx.fillText(footerText, canvas.width / 2, canvas.height - 20);

    return canvas.toBuffer('image/png');
  }
}
