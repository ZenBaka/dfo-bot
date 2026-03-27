import { ChatInputCommandInteraction, Client, AttachmentBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import SlashCommand from "../structures/SlashCommand";
import { IPlayerJSON } from "../interfaces/IPlayerJSON";
import { IInventoryItem } from "../interfaces/IInventoryJSON";
import { ICollectionJSON } from "../interfaces/ICollectionJSON";
import Routes from "../utilities/Routes";
import { apiFetch } from "../utilities/ApiClient";
import { formatError } from "../utilities/ErrorMessages";
import { EquipmentSlot } from "../interfaces/IItemJSON";
import ImageService from "../utilities/ImageService";

export default class ProfileCommand extends SlashCommand {
  constructor() {
    super({
      name: "profile",
      description: "View your or another player's profile",
      category: "General",
      cooldown: 5,
      isGlobalCommand: true
    });
    this.builder.addUserOption((o) => o.setName('user').setDescription('Select a user').setRequired(false));
  }

  public async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser('user', false) ?? interaction.user;

    const res = await apiFetch(Routes.player(targetUser.id));

    if (res.status === 404) {
      await interaction.editReply({ content: formatError('', 'PLAYER_NOT_FOUND') });
      return;
    }

    if (!res.ok) {
      await interaction.editReply({ content: formatError('Failed to load profile') });
      return;
    }

    const { data } = await res.json();
    const player = data.player as IPlayerJSON;
    const inventory = data.inventory as IInventoryItem[];
    const collection = data.collection as ICollectionJSON;
    const components: ActionRowBuilder<any>[] = [];

    // Generate the canvas profile image
    const imageBuffer = await ImageService.profile(player, targetUser);
    const profileAttachment = new AttachmentBuilder(imageBuffer, { name: 'profile.png' });

    // Only show interactive components for your OWN profile
    if (targetUser.id === interaction.user.id) {
      // Unequip select menu
      const options: StringSelectMenuOptionBuilder[] = [];
      const equipment = player.equipment;

      Object.entries(equipment).forEach(entry => {
        const slot = entry[0] as EquipmentSlot;
        const itemId = entry[1];
        if (itemId) {
          options.push(new StringSelectMenuOptionBuilder().setLabel(slot).setValue(slot));
        }
      });

      const menu = new StringSelectMenuBuilder().setCustomId('unequip')
        .setOptions(options.length >= 1 ? options : [new StringSelectMenuOptionBuilder().setLabel('None').setValue('None')])
        .setMaxValues(1)
        .setPlaceholder('Unequip Slot');

      components.push(new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(menu));

      // Skill points button (only if they have unspent points)
      if (player.skillPoints > 0) {
        const spButton = new ButtonBuilder()
          .setCustomId(`skillpoints:${player.skillPoints}`)
          .setLabel(`⭐ Spend Skill Points (${player.skillPoints} available)`)
          .setStyle(ButtonStyle.Primary);

        components.push(new ActionRowBuilder<ButtonBuilder>().setComponents(spButton));
      }
    }

    await interaction.editReply({
      files: [profileAttachment],
      components,
    });
  }
}