import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type Client,
  EmbedBuilder
} from 'discord.js';
import SlashCommand from '../structures/SlashCommand';
import { apiFetch } from '../utilities/ApiClient';
import { formatError } from '../utilities/ErrorMessages';
import * as Routes from '../utilities/Routes';
import * as ImageService from '../utilities/ImageService';
import type { IChestSlot } from '../interfaces/IGameJSON';
import { chunkArray } from '../utilities/helpers';

export default class ChestsCommand extends SlashCommand {
  constructor() {
    super({
      name: 'chests',
      description: 'View and manage your chest vault',
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
    const discordId = interaction.user.id;

    try {
      // Fetch player data to get chest info
      const res = await apiFetch(Routes.player(discordId));
      const playerBody = await res.json();

      if (!res.ok) {
        await interaction.editReply({
          content: formatError(playerBody.error ?? 'Failed to load player')
        });
        return;
      }

      // Fetch chest data via the chests endpoint (GET with discordId)
      const chestRes = await apiFetch(
        `${Routes.chests()}?discordId=${discordId}`
      );
      const chestBody = await chestRes.json();

      if (!chestRes.ok) {
        await interaction.editReply({
          content: formatError(chestBody.error ?? 'Failed to load chests')
        });
        return;
      }

      const chests: IChestSlot[] = chestBody.chests || [];
      const maxSlots = chestBody.maxSlots || 8;
      const divinePity = chestBody.divinePity || 0;
      const pityThreshold = chestBody.pityThreshold || 50;
      const totalOpened = chestBody.totalOpened || 0;

      // Build canvas image
      const imageBuffer = await ImageService.chests(chests, {
        maxSlots,
        divinePity,
        pityThreshold,
        totalOpened
      });

      const attachment = new AttachmentBuilder(imageBuffer, {
        name: 'chests.png'
      });
      const embed = new EmbedBuilder()
        .setColor(0xeab308)
        .setImage('attachment://chests.png');

      const components: ActionRowBuilder<ButtonBuilder>[] = [];

      // Action buttons for each chest (max 2 rows of 4)
      const actionable = chests.filter(
        (c) => c.status === 'ready' || c.status === 'locked'
      );
      const chunks = chunkArray(actionable, 4);

      for (const chunk of chunks.slice(0, 2)) {
        const row = new ActionRowBuilder<ButtonBuilder>();
        for (const chest of chunk) {
          const idx = chests.indexOf(chest) + 1;
          if (chest.status === 'ready') {
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`chest_open:${chest._id}`)
                .setLabel(`🎁 Open #${idx}`)
                .setStyle(ButtonStyle.Success)
            );
          } else if (chest.status === 'locked') {
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`chest_start:${chest._id}`)
                .setLabel(`🔓 Unlock #${idx}`)
                .setStyle(ButtonStyle.Primary)
            );
          }
        }
        if (row.components.length > 0) components.push(row);
      }

      // Shop row (buy chests) — only show if there's room
      if (chests.length < maxSlots) {
        const shopRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId('chest_buy:Common')
            .setLabel('📦 Buy Common')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('chest_buy:Uncommon')
            .setLabel('🟢 Buy Uncommon')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('chest_buy:Rare')
            .setLabel('🔵 Buy Rare')
            .setStyle(ButtonStyle.Secondary)
        );
        components.push(shopRow);
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
