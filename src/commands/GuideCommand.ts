import {
  type ChatInputCommandInteraction,
  type Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import SlashCommand from '../structures/SlashCommand';

const SECTIONS: Record<
  string,
  { title: string; emoji: string; content: string }
> = {
  basics: {
    title: 'Getting Started',
    emoji: '📖',
    content: [
      "**Welcome to Dragon's Fall Online!**",
      '',
      '`/register` — Create your character',
      '`/explore` — Take a step in your current zone. You may find gold, items, or enemies!',
      '`/attack` — Attack an enemy in combat. `/flee` to escape.',
      '`/profile` — View your character stats and equipment.',
      '`/inventory` — Browse your items. Select one to equip, sell, collect, or enhance.',
      '',
      '**HP & Healing**',
      '> HP regenerates passively — 10% of max HP every 5 minutes.',
      '> Use `/rest` to heal instantly at an inn (costs gold).',
      '> Consumable items can also restore HP.',
      '> HP is fully restored on level up.'
    ].join('\n')
  },
  combat: {
    title: 'Combat & Enemies',
    emoji: '⚔️',
    content: [
      '**Combat triggers randomly while exploring.**',
      '',
      'Enemies can have **prefixes** that modify their power and rewards:',
      '> 👑 **Champion** / 💀 **Mythic** — Very rare, very dangerous, huge rewards',
      '> ⚡ **Elite** / 🔥 **Furious** — Strong enemies with bonus loot chance',
      '> 💪 **Stout** / 🗡️ **Swift** — Moderate challenge',
      '> 😰 **Weak** / 🦴 **Frail** — Easy kills, reduced rewards',
      '',
      '**Affixes** on your gear give combat bonuses:',
      '> Crit Chance (cap: 75%) • Life Steal (cap: 25%) • Dodge (cap: 75%)',
      '> Gold Find (cap: 100%) • XP Bonus (cap: 100%) • Thorns (flat damage)'
    ].join('\n')
  },
  workshop: {
    title: 'Workshop — Enhance, Reforge, Dismantle',
    emoji: '🔨',
    content: [
      "**Access the workshop from any item's detail view.**",
      '',
      "⬆️ **Enhance** — Increase an item's stats. Costs gold + embers.",
      '> +1 to +5: Guaranteed success',
      '> +6 to +10: Decreasing success chance (80% → 20%)',
      '> Failed attempts consume resources. High-level failures may destroy the item.',
      '> Enhanced items become unique variants — they split from stacks.',
      '',
      "🔄 **Reforge** — Reroll an item's stats and/or affixes. Costs gold.",
      '> Stats: Reroll ATK/DEF/HP values',
      '> Affixes: Reroll special effects',
      '> Full: Reroll everything (costs more)',
      '',
      '🔥 **Dismantle** — Destroy items to earn **Embers**.',
      '> Enhanced items return 50% of the embers invested in them.',
      '> Embers are used for enhancement and other upgrades.'
    ].join('\n')
  },
  economy: {
    title: 'Economy & Gold Sinks',
    emoji: '🪙',
    content: [
      '**Gold Sources:** Combat kills, exploration, selling items, task rewards.',
      '**Gold Sinks:** Enhancement, reforging, rest at inn, zone tolls, market tax, chest shop.',
      '',
      '**Zone Tolls**',
      '> Zones 7+ charge gold per step. Higher zones charge more.',
      '> Greenleaf Meadow through Sunken Grotto are free.',
      '> The Absolute (Zone 20) costs 1,200g per step.',
      '',
      '**Market** (`/market`)',
      '> List items for other players to buy. 5% tax on sales.',
      '> Enhanced items can be listed and their stats are shown to buyers.',
      '> Modified items cannot be vendor-sold — use the market or dismantle.',
      '',
      '**Collection** (`/inventory` → Collect)',
      '> ⚠️ Permanent action! Items are removed from inventory.',
      '> Hit milestones for gold, XP, embers, and chests.',
      '> Modified items cannot be collected.'
    ].join('\n')
  },
  tasks: {
    title: 'Tasks & Chests',
    emoji: '📋',
    content: [
      '**Tasks** (`/tasks`)',
      '> Daily, Weekly, and Monthly objectives.',
      '> Earn gold, XP, and embers by completing them.',
      '> Tasks reset on their respective timers.',
      '',
      '**Chests** (`/chests`)',
      '> Earn chests from exploring, milestones, or buy from the shop.',
      '> Some chests unlock instantly; others take time.',
      '> Open chests for items, gold, and embers.',
      '> **Divine Pity**: After opening many chests without a Divine drop, one is guaranteed.'
    ].join('\n')
  },
  zones: {
    title: 'Zones & Travel',
    emoji: '🗺️',
    content: [
      '**Use `/travel` to move between zones.**',
      '',
      'Each zone has:',
      '> **Level Requirement** — Must be high enough level to enter',
      '> **Rarity Cap** — Maximum item rarity that can drop',
      '> **Difficulty Scalar** — Enemy stat multiplier',
      '> **Toll Cost** — Gold charged per step (Zones 7+)',
      '',
      'Higher zones have tougher enemies but better rewards and rarer drops.',
      'Zone XP multipliers are capped at 3.0× to prevent runaway leveling.'
    ].join('\n')
  }
};

const SECTION_ORDER = [
  'basics',
  'combat',
  'workshop',
  'economy',
  'tasks',
  'zones'
];

export default class GuideCommand extends SlashCommand {
  constructor() {
    super({
      name: 'guide',
      description: 'View the DFO game guide',
      category: 'General',
      cooldown: 3,
      isGlobalCommand: true
    });
    this.builder.addStringOption((o) => o
      .setName('section')
      .setDescription('Jump to a specific section')
      .setRequired(false)
      .addChoices(
        ...SECTION_ORDER.map((key) => ({
          name: `${SECTIONS[key].emoji} ${SECTIONS[key].title}`,
          value: key
        }))
      )
    );
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    client: Client
  ): Promise<void> {
    const section = interaction.options.getString('section') ?? 'basics';
    const data = SECTIONS[section] || SECTIONS.basics;

    const embed = new EmbedBuilder()
      .setColor(0x10b981)
      .setTitle(`${data.emoji} ${data.title}`)
      .setDescription(data.content)
      .setFooter({
        text: `DFO Guide • Use /guide <section> to jump to a topic`
      });

    // Section navigation buttons
    const currentIdx = SECTION_ORDER.indexOf(section);
    const navRow = new ActionRowBuilder<ButtonBuilder>();

    if (currentIdx > 0) {
      const prevKey = SECTION_ORDER[currentIdx - 1];
      const prev = SECTIONS[prevKey];
      navRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`guide_nav:${prevKey}`)
          .setLabel(`◀ ${prev.title}`)
          .setStyle(ButtonStyle.Secondary)
      );
    }

    if (currentIdx < SECTION_ORDER.length - 1) {
      const nextKey = SECTION_ORDER[currentIdx + 1];
      const next = SECTIONS[nextKey];
      navRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`guide_nav:${nextKey}`)
          .setLabel(`${next.title} ▶`)
          .setStyle(ButtonStyle.Secondary)
      );
    }

    await interaction.reply({
      embeds: [embed],
      components: navRow.components.length > 0 ? [navRow] : []
    });
  }
}
