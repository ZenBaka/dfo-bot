import {
  ActionRowBuilder,
  AttachmentBuilder,
  type ChatInputCommandInteraction,
  type Client,
  EmbedBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';
import SlashCommand from '../structures/SlashCommand';
import { apiFetch } from '../utilities/ApiClient';
import { formatError } from '../utilities/ErrorMessages';
import * as Routes from '../utilities/Routes';
import {
  getAccessibleZones,
  getZone,
  type ZoneInfo
} from '../utilities/ZoneData';
import * as ImageService from '../utilities/ImageService';

export default class TravelCommand extends SlashCommand {
  constructor() {
    super({
      name: 'travel',
      description: 'View the zone map and travel to a different zone',
      category: 'Gaming',
      cooldown: 5,
      isGlobalCommand: true
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    client: Client
  ): Promise<void> {
    await interaction.deferReply();

    // Fetch player data to get current zone and level
    try {
      const res = await apiFetch(Routes.player(interaction.user.id));

      if (res.status === 404) {
        await interaction.editReply({
          content: formatError('', 'PLAYER_NOT_FOUND')
        });
        return;
      }

      if (!res.ok) {
        await interaction.editReply({
          content: formatError('Failed to load player data')
        });
        return;
      }

      const { data } = await res.json();
      const player = data.player;
      const playerLevel = player?.level ?? 1;
      const currentZoneId = player?.currentZone ?? 1;

      // Render the zone map
      const imageBuffer = await ImageService.travel(playerLevel, currentZoneId);
      const attachment = new AttachmentBuilder(imageBuffer, {
        name: 'zonemap.png'
      });
      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setImage('attachment://zonemap.png');

      // Build the travel select menu with accessible zones (excluding current)
      const accessible = getAccessibleZones(playerLevel).filter(
        (z) => z.id !== currentZoneId
      );
      const currentZone = getZone(currentZoneId);

      const components: ActionRowBuilder<StringSelectMenuBuilder>[] = [];

      if (accessible.length > 0) {
        const options = accessible.map((zone) => new StringSelectMenuOptionBuilder()
          .setLabel(zone.name)
          .setDescription(
            `Lvl ${zone.levelReq}+ • ${zone.rarityCap} cap • ${zone.combatChance}% combat`
          )
          .setValue(String(zone.id))
        );

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('travel_select')
          .setPlaceholder(
            `Current: ${currentZone?.name ?? 'Unknown'} — Select destination...`
          )
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(options.slice(0, 25)); // Discord max 25 options

        components.push(
          new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
            selectMenu
          )
        );
      }

      await interaction.editReply({
        embeds: [embed],
        files: [attachment],
        components
      });
    } catch (err: any) {
      await interaction.editReply({
        content: formatError(err.message, err.code)
      });
    }
  }
}
