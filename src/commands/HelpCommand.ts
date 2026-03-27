import { ChatInputCommandInteraction, Client, EmbedBuilder, Colors } from "discord.js";
import SlashCommand from "../structures/SlashCommand";
import SlashCommandHandler from "../handlers/SlashCommandHandler";
import PaginatorBuilder from "../utilities/PaginatorBuilder";

const CATEGORY_ICONS: Record<string, string> = {
  'General': '📋',
  'Gaming': '⚔️',
  'Moderator': '🛡️',
  'Developer': '🔧',
};

const CATEGORY_COLORS: Record<string, number> = {
  'General': 0x3b82f6,
  'Gaming': 0xef4444,
  'Moderator': 0xf59e0b,
  'Developer': 0x6b7280,
};

export default class HelpCommand extends SlashCommand {
  constructor() {
    super({
      name: "help",
      description: "View all available commands and how to get started",
      category: "General",
      cooldown: 3,
      isGlobalCommand: true
    });
  }

  public async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    await interaction.deferReply();

    const commands = SlashCommandHandler.getCache();

    // Group commands by category
    const categories = new Map<string, SlashCommand[]>();

    for (const command of commands.values()) {
      const cat = command.getCategory();
      // Hide developer commands from regular users
      if (cat === 'Developer') continue;

      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat)!.push(command);
    }

    const pages: EmbedBuilder[] = [];

    // Page 1: Overview / Getting Started
    const overviewEmbed = new EmbedBuilder()
      .setColor(0x10b981)
      .setTitle('⚔️ Dragon\'s Fall Online')
      .setDescription(
        'A lightweight text-based MMORPG. Collect thousands of unique items, explore endless scenarios, and watch numbers go up.\n\n' +
        '**Getting Started:**\n' +
        '> 1. Run `/register` to create your character\n' +
        '> 2. Use `/explore` to adventure and find loot\n' +
        '> 3. Check `/inventory` to manage your gear\n' +
        '> 4. View `/profile` to see your stats\n\n' +
        '**Links:**\n' +
        '> 🌐 [Play on Web](https://capi.gg/dfo) • 🗳️ [Vote on top.gg](https://top.gg) • 💬 [Discord Server](https://discord.gg/dfo)'
      )
      .setThumbnail(client.user?.displayAvatarURL() ?? '');

    pages.push(overviewEmbed);

    // One page per category
    for (const [category, cmds] of categories) {
      const icon = CATEGORY_ICONS[category] || '📌';
      const color = CATEGORY_COLORS[category] || Colors.Blurple;

      let description = '';
      for (const cmd of cmds) {
        description += `**\`/${cmd.getName()}\`** — ${cmd.getDescription()}\n`;
      }

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${icon} ${category} Commands`)
        .setDescription(description);

      pages.push(embed);
    }

    const paginator = new PaginatorBuilder()
      .setPages(pages)
      .setTargetUser(interaction.user.id)
      .setIdleTimeout(120_000); // 2 minutes for help browsing

    await paginator.start(interaction);
  }
}