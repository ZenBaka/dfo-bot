import { ButtonInteraction, Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder } from "discord.js";
import Button from "../../structures/Button";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";
import ImageService from "../../utilities/ImageService";
import type { ITaskJSON } from "../../interfaces/IGameJSON";

export default class TasksTabButton extends Button {
  constructor() {
    super('tasks_tab');
  }

  // customId format: tasks_tab:<period>
  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();

    const period = args?.[0] ?? 'daily';
    const discordId = interaction.user.id;

    try {
      const res = await apiFetch(`${Routes.tasks()}?discordId=${discordId}`);
      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({ content: formatError(body.error ?? 'Failed to load tasks') });
        return;
      }

      const allTasks: ITaskJSON[] = body.tasks || [];
      const resets = body.resets || {};
      const playerEmbers = body.embers || 0;
      const tasks = allTasks.filter((t: ITaskJSON) => t.period === period);

      // Convert ISO reset string to ms remaining
      const resetIso = resets[period];
      const resetIn = resetIso ? Math.max(0, new Date(resetIso).getTime() - Date.now()) : 0;

      const imageBuffer = await ImageService.tasks(tasks, {
        period,
        resetIn,
        playerEmbers,
      });

      const attachment = new AttachmentBuilder(imageBuffer, { name: 'tasks.png' });
      const embed = new EmbedBuilder()
        .setColor(period === 'daily' ? 0x10b981 : period === 'weekly' ? 0x6366f1 : 0xc026d3)
        .setImage('attachment://tasks.png');

      const components: ActionRowBuilder<ButtonBuilder>[] = [];

      // Claim buttons — use correct field names (id, label, claimed)
      const claimable = tasks.filter((t: ITaskJSON) => t.progress >= t.target && !t.claimed);
      if (claimable.length > 0) {
        const claimRow = new ActionRowBuilder<ButtonBuilder>();
        for (const task of claimable.slice(0, 5)) {
          claimRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`task_claim:${task.id}:${period}`)
              .setLabel(`✅ ${(task.label || 'Task').slice(0, 30)}`)
              .setStyle(ButtonStyle.Success)
          );
        }
        components.push(claimRow);
      }

      // Period switcher
      components.push(
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder().setCustomId('tasks_tab:daily').setLabel('Daily').setStyle(period === 'daily' ? ButtonStyle.Primary : ButtonStyle.Secondary).setDisabled(period === 'daily'),
          new ButtonBuilder().setCustomId('tasks_tab:weekly').setLabel('Weekly').setStyle(period === 'weekly' ? ButtonStyle.Primary : ButtonStyle.Secondary).setDisabled(period === 'weekly'),
          new ButtonBuilder().setCustomId('tasks_tab:monthly').setLabel('Monthly').setStyle(period === 'monthly' ? ButtonStyle.Primary : ButtonStyle.Secondary).setDisabled(period === 'monthly'),
        )
      );

      await interaction.editReply({ embeds: [embed], files: [attachment], components: components as any });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code) });
    }
  }

  public isAuthorOnly(): boolean { return true; }
  public cooldown(): number { return 3; }
}
