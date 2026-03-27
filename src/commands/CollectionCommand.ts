import {
  type ChatInputCommandInteraction,
  type Client,
  EmbedBuilder
} from 'discord.js';
import SlashCommand from '../structures/SlashCommand';
import { type ICollectionJSON } from '../interfaces/ICollectionJSON';
import * as ItemManager from '../managers/ItemManager';
import PaginatorBuilder from '../utilities/PaginatorBuilder';
import * as Routes from '../utilities/Routes';
import { apiFetch } from '../utilities/ApiClient';
import { formatError } from '../utilities/ErrorMessages';

export default class CollectionCommand extends SlashCommand {
  constructor() {
    super({
      name: 'collection',
      description: "View your or another player's item collection",
      category: 'General',
      cooldown: 5,
      isGlobalCommand: true
    });

    this.builder.addUserOption((o) => o.setName('user').setDescription('Select a user').setRequired(false)
    );
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    client: Client
  ): Promise<void> {
    await interaction.deferReply();

    const targetUser =
      interaction.options.getUser('user', false) ?? interaction.user;

    const res = await apiFetch(Routes.player(targetUser.id));

    if (res.status === 404) {
      await interaction.editReply({
        content: `${targetUser.username} hasn't made any DFO player data!`
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
    const collection = data.collection as ICollectionJSON;

    // Safely parse the "Map" from JSON into an array of [itemId, quantity]
    let collectionItems: [string, number][] = [];
    if (collection?.items) {
      if (
        typeof collection.items === 'object' &&
        !Array.isArray(collection.items)
      ) {
        collectionItems = Object.entries(collection.items);
      } else if (collection.items instanceof Map) {
        collectionItems = Array.from(collection.items.entries());
      }
    }

    if (collectionItems.length === 0) {
      await interaction.editReply({
        content: `📖 **${targetUser.username}** hasn't discovered any items yet.`
      });
      return;
    }

    collectionItems.sort((a, b) => b[1] - a[1]);

    const ITEMS_PER_PAGE = 10;
    const pages: EmbedBuilder[] = [];

    const statsHeader = `**Unique Items Found:** ${collection.uniqueItemsFound}\n**Total Items Collected:** ${collection.totalItemsCollected}\n\n`;

    for (let i = 0; i < collectionItems.length; i += ITEMS_PER_PAGE) {
      const chunk = collectionItems.slice(i, i + ITEMS_PER_PAGE);

      let descriptionText = statsHeader;

      for (const [itemIdString, quantity] of chunk) {
        const itemId = parseInt(itemIdString, 10);
        const itemData = ItemManager.get(itemId);

        if (itemData) {
          descriptionText += `✨ **${itemData.name}** (x${quantity})\n`;
          descriptionText += `└ *${itemData.rarity} ${itemData.type}*\n\n`;
        } else {
          descriptionText += `✨ **Unknown Item #${itemId}** (x${quantity})\n\n`;
        }
      }

      const pageEmbed = new EmbedBuilder()
        .setTitle(`📖 ${targetUser.username}'s Collection`)
        .setColor('#8b5cf6')
        .setDescription(descriptionText)
        .setThumbnail(targetUser.displayAvatarURL({ forceStatic: false }));

      pages.push(pageEmbed);
    }

    const paginator = new PaginatorBuilder()
      .setPages(pages)
      .setTargetUser(interaction.user.id)
      .setIdleTimeout(60_000);

    await paginator.start(interaction);
  }
}
