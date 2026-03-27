import type { AnySelectMenuInteraction, Client } from 'discord.js';
import SelectMenu from '../../structures/SelectMenu';
import { apiFetch } from '../../utilities/ApiClient';
import { formatError } from '../../utilities/ErrorMessages';
import * as Routes from '../../utilities/Routes';

export default class ReforgeSelectMenu extends SelectMenu {
  constructor() {
    super({ customId: 'reforge_select', cooldown: 3, isAuthorOnly: true });
  }

  // customId format: reforge_select:<docId>:<itemId>
  public async execute(
    interaction: AnySelectMenuInteraction,
    client: Client,
    args?: string[] | null
  ): Promise<void> {
    await interaction.deferUpdate();

    const docId = args?.[0];
    const itemId = parseInt(args?.[1] ?? '-1', 10);
    const reforgeType = interaction.values[0]; // 'stats' | 'affixes' | 'full'

    if (!docId || isNaN(itemId) || !reforgeType) {
      await interaction.editReply({
        content: 'Error parsing reforge data!',
        components: [],
        embeds: []
      });
      return;
    }

    try {
      const res = await apiFetch(Routes.reforge(), {
        method: 'POST',
        body: JSON.stringify({
          discordId: interaction.user.id,
          itemId,
          inventoryId: docId,
          reforgeType
        })
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({
          content: formatError(body.error ?? 'Reforge failed'),
          components: [],
          embeds: []
        });
        return;
      }

      const lines = [
        `🔄 **Reforge Complete!** (${reforgeType.toUpperCase()})`,
        `📦 **${body.itemName}**`,
        `🪙 Cost: **${body.goldSpent?.toLocaleString() ?? '???'}** gold`,
        `💰 Balance: **${body.newBalance?.toLocaleString() ?? '???'}** gold`,
        ``
      ];

      // Show stat comparison if stats were reforged
      if (
        body.oldStats &&
        body.newStats &&
        (reforgeType === 'stats' || reforgeType === 'full')
      ) {
        const fmtStat = (label: string, old: number, now: number): string => {
          const diff = now - old;
          const arrow = diff > 0 ? '🟢' : diff < 0 ? '🔴' : '⚪';
          return `${arrow} ${label}: ${old} → **${now}** (${diff > 0 ? '+' : ''}${diff})`;
        };
        lines.push('**Stats:**');
        lines.push(fmtStat('ATK', body.oldStats.atk, body.newStats.atk));
        lines.push(fmtStat('DEF', body.oldStats.def, body.newStats.def));
        lines.push(fmtStat('HP', body.oldStats.hp, body.newStats.hp));
      }

      // Show affix comparison if affixes were reforged
      if (
        body.newAffixes &&
        (reforgeType === 'affixes' || reforgeType === 'full')
      ) {
        lines.push(``, `**New Affixes:**`);
        if (body.newAffixes.length === 0) {
          lines.push('None');
        } else {
          for (const affix of body.newAffixes) {
            lines.push(
              `• ${affix.type.replace(/_/g, ' ')} +${affix.value}${affix.type === 'THORNS' ? '' : '%'}`
            );
          }
        }
      }

      await interaction.editReply({
        content: lines.join('\n'),
        components: [],
        embeds: []
      });
    } catch (err: any) {
      await interaction.editReply({
        content: formatError(err.message, err.code),
        components: [],
        embeds: []
      });
    }
  }
}
