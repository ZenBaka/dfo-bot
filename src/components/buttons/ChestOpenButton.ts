import { ButtonInteraction, Client } from "discord.js";
import Button from "../../structures/Button";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";

const RARITY_EMOJIS: Record<string, string> = {
  Common: '⬜', Uncommon: '🟩', Rare: '🟦', Elite: '🟧',
  Epic: '🟪', Legendary: '🟡', Divine: '💎', Exotic: '💜',
};

export default class ChestOpenButton extends Button {
  constructor() {
    super('chest_open');
  }

  // customId format: chest_open:<chestId>
  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();

    const chestId = args?.[0];
    if (!chestId) {
      await interaction.editReply({ content: 'Error parsing chest data!', files: [], components: [], embeds: [] });
      return;
    }

    try {
      const res = await apiFetch(Routes.chests(), {
        method: 'POST',
        body: JSON.stringify({ discordId: interaction.user.id, action: 'open', chestId }),
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({ content: formatError(body.error ?? 'Failed to open chest'), files: [], components: [], embeds: [] });
        return;
      }

      const loot = body.loot;
      const lines = [
        `🎉 **Chest Opened!**`,
        ``,
      ];

      if (loot.isPity) {
        lines.push(`✨ **PITY BONUS — Guaranteed Divine item!**`);
        lines.push(``);
      }

      // Items
      for (const item of loot.items) {
        const emoji = RARITY_EMOJIS[item.rarity] || '📦';
        lines.push(`${emoji} **${item.name}** — ${item.rarity} ${item.type} (Lvl ${item.level})`);
      }

      // Gold & Embers
      lines.push(``);
      if (loot.gold > 0) lines.push(`🪙 **+${loot.gold.toLocaleString()}** Gold`);
      if (loot.embers > 0) lines.push(`🔥 **+${loot.embers.toLocaleString()}** Embers`);

      await interaction.editReply({ content: lines.join('\n'), files: [], components: [], embeds: [] });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code), files: [], components: [], embeds: [] });
    }
  }

  public isAuthorOnly(): boolean { return true; }
  public cooldown(): number { return 3; }
}
