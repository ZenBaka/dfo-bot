import {
  ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle,
  ChatInputCommandInteraction, Client, EmbedBuilder, StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import SlashCommand from "../structures/SlashCommand";
import { apiFetch } from "../utilities/ApiClient";
import { formatError } from "../utilities/ErrorMessages";
import Routes from "../utilities/Routes";
import ImageService from "../utilities/ImageService";
import type { ITaskJSON } from "../interfaces/IGameJSON";

export default class TasksCommand extends SlashCommand {
  constructor() {
    super('tasks', 'View your active tasks and claim rewards', 'Gaming');
    this.data.addStringOption((o) =>
      o.setName('period')
        .setDescription('Task period to view')
        .setRequired(false)
        .addChoices(
          { name: 'Daily', value: 'daily' },
          { name: 'Weekly', value: 'weekly' },
          { name: 'Monthly', value: 'monthly' },
        )
    );
  }

  public async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    await interaction.deferReply();
    const period = interaction.options.getString('period') ?? 'daily';
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

      // Filter to selected period
      const tasks = allTasks.filter((t: ITaskJSON) => t.period === period);

      // Convert ISO reset string to ms remaining
      const resetIso = resets[period];
      const resetIn = resetIso ? Math.max(0, new Date(resetIso).getTime() - Date.now()) : 0;

      // Build canvas image
      const imageBuffer = await ImageService.tasks(tasks, {
        period,
        resetIn,
        playerEmbers,
      });

      const attachment = new AttachmentBuilder(imageBuffer, { name: 'tasks.png' });
      const embed = new EmbedBuilder()
        .setColor(period === 'daily' ? 0x10b981 : period === 'weekly' ? 0x6366f1 : 0xc026d3)
        .setImage('attachment://tasks.png');

      const components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = [];

      // Claim buttons for completed unclaimed tasks
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

      // Period switcher row
      const periodRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
          .setCustomId(`tasks_tab:daily`)
          .setLabel('Daily')
          .setStyle(period === 'daily' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(period === 'daily'),
        new ButtonBuilder()
          .setCustomId(`tasks_tab:weekly`)
          .setLabel('Weekly')
          .setStyle(period === 'weekly' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(period === 'weekly'),
        new ButtonBuilder()
          .setCustomId(`tasks_tab:monthly`)
          .setLabel('Monthly')
          .setStyle(period === 'monthly' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(period === 'monthly'),
      );
      components.push(periodRow);

      await interaction.editReply({ embeds: [embed], files: [attachment], components: components as any });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code) });
    }
  }

  public isGlobalCommand(): boolean { return true; }
  public cooldown(): number { return 5; }
}
