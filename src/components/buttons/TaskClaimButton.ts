import { ButtonInteraction, Client } from "discord.js";
import Button from "../../structures/Button";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";

export default class TaskClaimButton extends Button {
  constructor() {
    super('task_claim');
  }

  // customId format: task_claim:<taskId>:<period>
  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();

    const taskId = args?.[0];
    const period = args?.[1] ?? 'daily';

    if (!taskId) {
      await interaction.editReply({ content: 'Error parsing task data!', files: [], components: [] });
      return;
    }

    try {
      const res = await apiFetch(Routes.tasks(), {
        method: 'POST',
        body: JSON.stringify({ discordId: interaction.user.id, action: 'claim', taskId, period }),
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({ content: formatError(body.error ?? 'Failed to claim task'), files: [], components: [] });
        return;
      }

      const reward = body.reward;
      const lines = [
        `✅ **Task Claimed!**`,
        ``,
      ];

      if (reward) {
        if (reward.gold > 0) lines.push(`🪙 **+${reward.gold.toLocaleString()}** Gold`);
        if (reward.xp > 0) lines.push(`✨ **+${reward.xp.toLocaleString()}** XP`);
        if (reward.embers > 0) lines.push(`🔥 **+${reward.embers.toLocaleString()}** Embers`);
      }

      if (body.levelsGained > 0) {
        lines.push(``, `🆙 **Gained ${body.levelsGained} Level${body.levelsGained > 1 ? 's' : ''}!**`);
      }

      lines.push(``, `Run \`/tasks ${period}\` to see remaining tasks.`);

      await interaction.editReply({ content: lines.join('\n'), files: [], components: [] });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code), files: [], components: [] });
    }
  }

  public isAuthorOnly(): boolean { return true; }
  public cooldown(): number { return 3; }
}
