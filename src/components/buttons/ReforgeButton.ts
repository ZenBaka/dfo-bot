import {
  ButtonInteraction, Client, ActionRowBuilder,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} from "discord.js";
import Button from "../../structures/Button";

export default class ReforgeButton extends Button {
  constructor() {
    super('reforge');
  }

  // customId format: reforge:<docId>:<itemId>
  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    const docId = args?.[0];
    const itemId = args?.[1];

    if (!docId || !itemId) {
      await interaction.reply({ content: 'Error parsing item data!', ephemeral: true });
      return;
    }

    // Show a select menu for reforge type
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`reforge_select:${docId}:${itemId}`)
      .setPlaceholder('Select reforge type...')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Reforge Stats')
          .setDescription('Reroll ATK, DEF, HP values')
          .setValue('stats'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Reforge Affixes')
          .setDescription('Reroll special effects (Life Steal, Crit, etc.)')
          .setValue('affixes'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Full Reforge')
          .setDescription('Reroll both stats and affixes (costs more)')
          .setValue('full'),
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(selectMenu);

    await interaction.reply({
      content: '🔄 **Select Reforge Type**\nChoose what to reroll on this item:',
      components: [row],
      ephemeral: true,
    });
  }

  public isAuthorOnly(): boolean { return true; }
  public cooldown(): number { return 3; }
}
