import { ActionRowBuilder, AnySelectMenuInteraction, AttachmentBuilder, Client, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import SelectMenu from "../../structures/SelectMenu";
import Routes from "../../utilities/Routes";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import { IPlayerJSON } from "../../interfaces/IPlayerJSON";
import ImageService from "../../utilities/ImageService";
import { EquipmentSlot } from "../../interfaces/IItemJSON";

export default class UnequipMenu extends SelectMenu {
  constructor() {
    super('unequip');
  }

  public async execute(interaction: AnySelectMenuInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();

    const slot = interaction.values[0];
    const discordId = interaction.user.id;
    const extraMenu: ActionRowBuilder<StringSelectMenuBuilder>[] = [];

    const res = await apiFetch(Routes.unequip(), {
      method: 'POST',
      body: JSON.stringify({ discordId, slot })
    });

    const { success, error, player }: { success?: boolean, error?: string, player?: IPlayerJSON } = await res.json();

    if (res.status === 400 || res.status === 401 || res.status === 404 || res.status === 500) {
      await interaction.editReply({ content: formatError(error ?? `Unequip failed (Code: ${res.status})`), files: [], components: [], embeds: [] });
      return;
    }

    if (success) {
      const profile = await ImageService.profile(player!, interaction.user);
      const profileAttachment = new AttachmentBuilder(profile, { name: 'profile.png' });

      if (player!.id === interaction.user.id) {
        const options: StringSelectMenuOptionBuilder[] = [];

        const equipment = player!.equipment;

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

        extraMenu.push(new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(menu));
      }

      await interaction.editReply({
        files: [profileAttachment],
        components: extraMenu,
      });
    } else {
      await interaction.editReply({ content: 'Unknown error!', components: [], embeds: [], files: [] });
      return;
    }
  }

  public isAuthorOnly(): boolean {
    return true;
  }

  public cooldown(): number {
    return 2;
  }
}
