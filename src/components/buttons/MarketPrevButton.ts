import { AttachmentBuilder, ButtonInteraction, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from "discord.js";
import Button from "../../structures/Button";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";
import MarketImageBuilder, { type MarketListing, type MarketPageConfig } from "../../utilities/MarketImageBuilder";

export default class MarketPrevButton extends Button {
  constructor() { super({ customId: "mkt_prev", cooldown: 2, isAuthorOnly: true }); }

  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();
    await handleMarketPage(interaction, args, -1);
  }
}

/**
 * Shared pagination handler for prev/next.
 * CustomId format: mkt_prev:currentPage:search|rarity|type|sort:mode
 */
export async function handleMarketPage(interaction: ButtonInteraction, args: string[] | null | undefined, direction: number): Promise<void> {
  if (!args || args.length < 3) return;

  const currentPage = parseInt(args[0], 10);
  const filterKey = args[1]; // "search|rarity|type|sort"
  const mode = args[2] as 'browse' | 'my_listings';
  const targetPage = Math.max(1, currentPage + direction);
  const discordId = interaction.user.id;

  try {
    let url: string;

    if (mode === 'my_listings') {
      url = Routes.marketMyListings(discordId, targetPage);
    } else {
      const [search, rarity, type, sort] = filterKey.split('|');
      url = Routes.marketBrowse(discordId, {
        page: targetPage,
        search: search || undefined,
        rarity: rarity || 'All',
        type: type || 'All',
        sort: sort || 'newest',
      });
    }

    const res = await apiFetch(url);
    const body = await res.json();

    if (!res.ok || !body.success) {
      await interaction.editReply({ content: formatError(body.error ?? 'Failed to load market') });
      return;
    }

    const listings: MarketListing[] = body.data;
    const config: MarketPageConfig = { page: body.pagination.page, totalPages: body.pagination.totalPages, totalItems: body.pagination.totalItems, mode };

    const imageBuffer = await MarketImageBuilder.build(listings, config);
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'market.png' });
    const embed = new EmbedBuilder().setColor(mode === 'my_listings' ? 0x3b82f6 : 0x10b981).setImage('attachment://market.png');

    // Rebuild action + pagination buttons
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];

    if (listings.length > 0) {
      const isBrowse = mode === 'browse';
      // Up to 2 rows of 4 action buttons
      for (let rowStart = 0; rowStart < listings.length && rows.length < 2; rowStart += 4) {
        const row = new ActionRowBuilder<ButtonBuilder>();
        for (let j = rowStart; j < Math.min(rowStart + 4, listings.length); j++) {
          const listing = listings[j];
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`${isBrowse ? 'mkt_buy' : 'mkt_cancel'}:${listing.listingId}`)
              .setLabel(`${isBrowse ? '🛒' : '❌'} ${j + 1}`)
              .setStyle(isBrowse ? ButtonStyle.Success : ButtonStyle.Danger)
          );
        }
        rows.push(row);
      }
    }

    if (config.totalPages > 1) {
      rows.push(new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder().setCustomId(`mkt_prev:${config.page}:${filterKey}:${mode}`).setLabel('◀ Prev').setStyle(ButtonStyle.Secondary).setDisabled(config.page <= 1),
        new ButtonBuilder().setCustomId(`mkt_next:${config.page}:${filterKey}:${mode}`).setLabel('Next ▶').setStyle(ButtonStyle.Secondary).setDisabled(config.page >= config.totalPages),
      ));
    }

    await interaction.editReply({ embeds: [embed], files: [attachment], components: rows });
  } catch (err: any) {
    await interaction.editReply({ content: formatError(err.message, err.code) });
  }
}