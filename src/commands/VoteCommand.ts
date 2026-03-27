import {
  type ChatInputCommandInteraction,
  type Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import SlashCommand from '../structures/SlashCommand';

export default class VoteCommand extends SlashCommand {
  constructor() {
    super({
      name: 'vote',
      description: 'Support DFO by voting on top.gg!',
      category: 'General',
      cooldown: 5,
      isGlobalCommand: true
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    client: Client
  ): Promise<void> {
    const botId = client.user?.id ?? '';

    const embed = new EmbedBuilder()
      .setColor(0xff3366)
      .setTitle("🗳️ Vote for Dragon's Fall Online!")
      .setDescription(
        'Voting helps more players discover DFO and keeps the project alive.\n\n' +
          'You can vote every **12 hours** on top.gg. Thank you for your support!'
      )
      .setThumbnail(client.user?.displayAvatarURL() ?? '');

    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setLabel('Vote on top.gg')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://top.gg/bot/${botId}/vote`)
        .setEmoji('🗳️'),
      new ButtonBuilder()
        .setLabel('Play on Web')
        .setStyle(ButtonStyle.Link)
        .setURL('https://capi.gg/dfo')
        .setEmoji('🌐')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
}
