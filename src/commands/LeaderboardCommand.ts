import { AttachmentBuilder, ChatInputCommandInteraction, Client, EmbedBuilder } from "discord.js";
import SlashCommand from "../structures/SlashCommand";
import { apiFetch } from "../utilities/ApiClient";
import Routes from "../utilities/Routes";
import { formatError } from "../utilities/ErrorMessages";
import { type LeaderboardEntry, type LeaderboardConfig } from "../utilities/LeaderboardImageBuilder";
import ImageService from "../utilities/ImageService";

const STAT_OPTIONS = [
  { name: 'Level', value: 'level' },
  { name: 'Gold', value: 'coins' },
  { name: 'Enemies Defeated', value: 'enemiesDefeated' },
  { name: 'Days Explored', value: 'daysPassed' },
];

const STAT_DISPLAY: Record<string, LeaderboardConfig> = {
  'level': {
    title: 'Leaderboard — Level',
    stat: 'Level',
    emoji: '⭐',
    accentColor: '#eab308',
    accentColorDim: '#eab30825',
  },
  'coins': {
    title: 'Leaderboard — Gold',
    stat: 'Gold',
    emoji: '🪙',
    accentColor: '#f59e0b',
    accentColorDim: '#f59e0b25',
  },
  'enemiesDefeated': {
    title: 'Leaderboard — Enemies Defeated',
    stat: 'Enemies Defeated',
    emoji: '💀',
    accentColor: '#ef4444',
    accentColorDim: '#ef444425',
  },
  'daysPassed': {
    title: 'Leaderboard — Days Explored',
    stat: 'Days Explored',
    emoji: '📅',
    accentColor: '#3b82f6',
    accentColorDim: '#3b82f625',
  },
};

export default class LeaderboardCommand extends SlashCommand {
  constructor() {
    super({
      name: "leaderboard",
      description: "View the top players",
      category: "General",
      cooldown: 10,
      isGlobalCommand: true
    });

    this.builder.addStringOption((o) =>
      o.setName('stat')
        .setDescription('Which stat to rank by')
        .setChoices(STAT_OPTIONS)
        .setRequired(false)
    );
  }

  public async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    await interaction.deferReply();

    const stat = interaction.options.getString('stat', false) ?? 'level';
    const config = STAT_DISPLAY[stat] ?? STAT_DISPLAY['level'];

    try {
      const res = await apiFetch(Routes.leaderboard(stat));

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        await interaction.editReply({ content: formatError(body.error ?? 'Failed to load leaderboard') });
        return;
      }

      const { data }: { data: any[] } = await res.json();

      if (!data || data.length === 0) {
        await interaction.editReply({ content: '📊 **No players found yet.** Be the first to `/register`!' });
        return;
      }

      // Map API data to the image builder's expected shape
      const entries: LeaderboardEntry[] = data.map(player => {
        let value: number;
        if (stat === 'enemiesDefeated' || stat === 'daysPassed') {
          value = player.statistics?.[stat] ?? 0;
        } else {
          value = player[stat] ?? 0;
        }

        return {
          username: player.username,
          value,
          level: player.level ?? 1,
        };
      });

      const imageBuffer = await ImageService.leaderboard(entries, config);
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'leaderboard.png' });

      const embed = new EmbedBuilder()
        .setColor(parseInt(config.accentColor.replace('#', ''), 16))
        .setImage('attachment://leaderboard.png');

      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code) });
    }
  }
}