import {
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  type ChatInputCommandInteraction,
  type Client,
  ContainerBuilder,
  MessageFlags
} from 'discord.js';
import SlashCommand from '../structures/SlashCommand';
import logger from '../utilities/Logger';

export default class TestCommand extends SlashCommand {
  constructor() {
    super({
      name: 'test',
      description: 'dev command',
      category: 'Developer',
      cooldown: 5,
      isGlobalCommand: false
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    client: Client
  ): Promise<void> {
    await interaction.deferReply();

    const res = await fetch('https://capi.gg/api/facts/random', {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const { factId, text } = await res.json();

    const codes = [400, 401, 404, 500];

    if (codes.includes(res.status)) {
      await interaction.editReply({ content: text });
      return;
    }

    await interaction.editReply({ content: `\`${factId}\`\n${text}` });
  }
}
