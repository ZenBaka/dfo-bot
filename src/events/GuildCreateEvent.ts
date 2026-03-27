import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, Colors, ContainerBuilder, EmbedBuilder, Events, Guild, MessageFlags, TextChannel } from "discord.js";
import Event from "../structures/Event";
import logger from "../utilities/Logger";

export default class GuildCreateEvent extends Event {
  constructor() {
    super({
      name: Events.GuildCreate,
      isOnce: false
    });
  }

  public async execute(guild: Guild, client: Client): Promise<void> {
    // 1. Log to your private channel
    try {
      const logChannel = await client.channels.fetch('1473407797289816074') as TextChannel;
      if (logChannel && guild) {
        const container = new ContainerBuilder().setAccentColor(Colors.Green)
          .addSectionComponents(
            (section) =>
              section.setThumbnailAccessory((t) => t.setURL(guild.iconURL() ?? client.user?.avatarURL()!))
              .addTextDisplayComponents(
                (textDisplay) =>
                  textDisplay.setContent('## I Joined A New Server!'),
                (textDisplay) =>
                  textDisplay.setContent(`Joined the ${guild.name} server! It has ${guild.memberCount.toLocaleString()} members.`),
                (textDisplay) =>
                  textDisplay.setContent(`-# ID: \`${guild.id}\``)
              )
          );

        await logChannel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
    } catch (e) {
      logger.error(e);
    }

    // 2. Send a welcome embed to the guild
    try {
      // Try system channel first, then the first text channel the bot can write in
      const targetChannel = guild.systemChannel
        ?? guild.channels.cache
          .filter(c => c.isTextBased() && c.permissionsFor(guild.members.me!)?.has('SendMessages'))
          .first() as TextChannel | undefined;

      if (!targetChannel) return;

      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('⚔️ Dragon\'s Fall Online')
        .setDescription(
          'Thanks for adding DFO! A lightweight text-based MMORPG where you can collect thousands of unique items, explore endless scenarios, and watch numbers go up.\n\n' +
          '**Get started in 30 seconds:**\n' +
          '> 1. `/register` — Create your character\n' +
          '> 2. `/explore` — Venture into the world\n' +
          '> 3. `/profile` — Check your stats\n' +
          '> 4. `/help` — See all commands\n\n' +
          'You can also play on the web at **[capi.gg/dfo](https://capi.gg/dfo)**'
        )
        .setThumbnail(client.user?.displayAvatarURL() ?? '')
        .setFooter({ text: 'DFO Cross-Platform Integration' });

      const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
          .setLabel('Play on Web')
          .setStyle(ButtonStyle.Link)
          .setURL('https://capi.gg/dfo')
          .setEmoji('🌐'),
        new ButtonBuilder()
          .setLabel('Support Server')
          .setStyle(ButtonStyle.Link)
          .setURL('https://discord.gg/3MJkKkh99q')
          .setEmoji('💬'),
      );

      await targetChannel.send({ embeds: [embed], components: [row] });
    } catch (e) {
      // Not critical — some guilds block bot messages in all channels
      logger.warn(`[GuildCreate] Could not send welcome message to ${guild.name}: ${e}`);
    }

    logger.info(`Joined a new guild! ${guild.name} (${guild.id})`);
  }
}