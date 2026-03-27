import type { ButtonInteraction, Client } from 'discord.js';
import Button from '../../structures/Button';

const SECTIONS: Record<
  string,
  { title: string; emoji: string; content: string }
> = {
  basics: {
    title: 'Getting Started',
    emoji: '📖',
    content: 'Use `/guide basics` to see full content.'
  },
  combat: { title: 'Combat & Enemies', emoji: '⚔️', content: '' },
  workshop: { title: 'Workshop', emoji: '🔨', content: '' },
  economy: { title: 'Economy & Gold Sinks', emoji: '🪙', content: '' },
  tasks: { title: 'Tasks & Chests', emoji: '📋', content: '' },
  zones: { title: 'Zones & Travel', emoji: '🗺️', content: '' }
};

// Import the full sections from GuideCommand would create circular dependency,
// so we duplicate the content lookup here. In practice, you'd extract SECTIONS to a shared file.
// For now, this button just re-invokes the guide display logic.

const SECTION_ORDER = [
  'basics',
  'combat',
  'workshop',
  'economy',
  'tasks',
  'zones'
];

export default class GuideNavButton extends Button {
  constructor() {
    super({ customId: 'guide_nav', cooldown: 1, isAuthorOnly: false });
  }

  // customId format: guide_nav:<sectionKey>
  public async execute(
    interaction: ButtonInteraction,
    client: Client,
    args?: string[] | null
  ): Promise<void> {
    const section = args?.[0] ?? 'basics';

    // Re-trigger the guide command programmatically isn't possible with buttons,
    // so we tell the user to use the command
    await interaction.reply({
      content: `📖 Use \`/guide ${section}\` to view the **${SECTIONS[section]?.title ?? section}** section.`,
      ephemeral: true
    });
  } // Anyone can navigate the guide
}
