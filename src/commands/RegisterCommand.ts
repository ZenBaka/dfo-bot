import {
  type ChatInputCommandInteraction,
  type Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import SlashCommand from '../structures/SlashCommand';

export default class RegisterCommand extends SlashCommand {
  constructor() {
    super({
      name: 'register',
      description: 'Register new user data with the bot',
      category: 'General',
      cooldown: 5,
      isGlobalCommand: true
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    client: Client
  ): Promise<void> {
    // Show the consent prompt — registration happens when they click Accept
    const embed = new EmbedBuilder()
      .setColor(0x10b981)
      .setTitle("⚔️ Welcome to Dragon's Fall Online")
      .setDescription(
        'Before creating your character, please review the following:\n\n' +
          '**What we store:**\n' +
          '> Your Discord user ID, username, and avatar are used to create your player profile. ' +
          'Gameplay data (level, inventory, stats) is stored on our servers.\n\n' +
          '**Your rights:**\n' +
          '> You may request full deletion of your player data at any time by contacting the developer.\n\n' +
          '**By clicking Accept**, you agree to our [Privacy Policy & Terms of Service](https://capi.gg/legal).\n\n' +
          '-# You can review our full legal page at any time: https://capi.gg/legal'
      )
      .setFooter({ text: 'DFO Cross-Platform Integration' });

    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId('register_accept')
        .setLabel('Accept & Create Character')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId('register_decline')
        .setLabel('Decline')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel('Privacy Policy & ToS')
        .setStyle(ButtonStyle.Link)
        .setURL('https://capi.gg/legal')
        .setEmoji('📜')
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  }
}
