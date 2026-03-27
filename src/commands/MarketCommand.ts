import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
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
  type MarketListing,
  type MarketPageConfig
} from '../utilities/MarketImageBuilder';
import * as ImageService from '../utilities/ImageService';
import * as ItemManager from '../managers/ItemManager';
import type { IInventoryItem } from '../interfaces/IInventoryJSON';
import { chunkArray } from '../utilities/helpers';

const RARITY_CHOICES = [
  { name: 'All', value: 'All' },
  { name: 'Common', value: 'Common' },
  { name: 'Uncommon', value: 'Uncommon' },
  { name: 'Rare', value: 'Rare' },
  { name: 'Elite', value: 'Elite' },
  { name: 'Epic', value: 'Epic' },
  { name: 'Legendary', value: 'Legendary' },
  { name: 'Divine', value: 'Divine' },
  { name: 'Exotic', value: 'Exotic' }
];

const SORT_CHOICES = [
  { name: 'Newest', value: 'newest' },
  { name: 'Price: Low → High', value: 'price_asc' },
  { name: 'Price: High → Low', value: 'price_desc' },
  { name: 'Level: High → Low', value: 'level_desc' },
  { name: 'Highest ATK', value: 'atk_desc' },
  { name: 'Highest DEF', value: 'def_desc' },
  { name: 'Highest HP', value: 'hp_desc' }
];

const TYPE_CHOICES = [
  { name: 'All', value: 'All' },
  { name: 'Weapon', value: 'Weapon' },
  { name: 'Armor', value: 'Armor' },
  { name: 'Accessory', value: 'Accessory' },
  { name: 'Consumable', value: 'Consumable' }
];

export const SELL_PAGE_SIZE = 25;

export default class MarketCommand extends SlashCommand {
  constructor() {
    super({
      name: 'market',
      description: 'Browse and trade on the Global Market',
      category: 'Gaming',
      cooldown: 5,
      isGlobalCommand: true
    });

    this.data
      .addSubcommand((sub) => sub
        .setName('browse')
        .setDescription('Browse items for sale on the Global Market')
        .addStringOption((o) => o
          .setName('search')
          .setDescription('Search by item name')
          .setRequired(false)
        )
        .addStringOption((o) => o
          .setName('rarity')
          .setDescription('Filter by rarity')
          .setChoices(RARITY_CHOICES)
          .setRequired(false)
        )
        .addStringOption((o) => o
          .setName('type')
          .setDescription('Filter by item type')
          .setChoices(TYPE_CHOICES)
          .setRequired(false)
        )
        .addStringOption((o) => o
          .setName('sort')
          .setDescription('Sort order')
          .setChoices(SORT_CHOICES)
          .setRequired(false)
        )
      )
      .addSubcommand((sub) => sub
        .setName('listings')
        .setDescription('View your active market listings')
      )
      .addSubcommand((sub) => sub
        .setName('sell')
        .setDescription(
          'Select an item from your inventory to list on the market'
        )
      );
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    client: Client
  ): Promise<void> {
    const sub = interaction.options.getSubcommand(true);
    const discordId = interaction.user.id;

    switch (sub) {
    case 'browse':
      return this.handleBrowse(interaction, discordId);
    case 'listings':
      return this.handleListings(interaction, discordId);
    case 'sell':
      return this.handleSell(interaction, discordId);
    }
  }

  private async handleBrowse(
    interaction: ChatInputCommandInteraction,
    discordId: string
  ): Promise<void> {
    await interaction.deferReply();

    const search = interaction.options.getString('search') ?? '';
    const rarity = interaction.options.getString('rarity') ?? 'All';
    const type = interaction.options.getString('type') ?? 'All';
    const sort = interaction.options.getString('sort') ?? 'newest';

    try {
      const res = await apiFetch(
        Routes.marketBrowse(discordId, {
          page: 1,
          search: search || undefined,
          rarity,
          type,
          sort
        })
      );
      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({
          content: formatError(body.error ?? 'Failed to load market')
        });
        return;
      }

      const listings: MarketListing[] = body.data;
      const pagination = body.pagination;
      const config: MarketPageConfig = {
        page: pagination.page,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        mode: 'browse'
      };

      const imageBuffer = await ImageService.market(listings, config);
      const attachment = new AttachmentBuilder(imageBuffer, {
        name: 'market.png'
      });
      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setImage('attachment://market.png');

      const filterKey = `${(search || '').slice(0, 30)}|${rarity}|${type}|${sort}`;
      const components = buildMarketButtons(
        listings,
        config,
        filterKey,
        'browse'
      );

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

  private async handleListings(
    interaction: ChatInputCommandInteraction,
    discordId: string
  ): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const res = await apiFetch(Routes.marketMyListings(discordId));
      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({
          content: formatError(body.error ?? 'Failed to load your listings')
        });
        return;
      }

      const listings: MarketListing[] = body.data;
      const pagination = body.pagination;
      const config: MarketPageConfig = {
        page: pagination.page,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        mode: 'my_listings'
      };

      const imageBuffer = await ImageService.market(listings, config);
      const attachment = new AttachmentBuilder(imageBuffer, {
        name: 'my_listings.png'
      });
      const embed = new EmbedBuilder()
        .setColor(0x3b82f6)
        .setImage('attachment://my_listings.png');

      const components = buildMarketButtons(
        listings,
        config,
        '',
        'my_listings'
      );

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

  private async handleSell(
    interaction: ChatInputCommandInteraction,
    discordId: string
  ): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const result = await buildSellPage(discordId, 0);
      await interaction.editReply(result);
    } catch (err: any) {
      await interaction.editReply({
        content: formatError(err.message, err.code)
      });
    }
  }
}

/**
 * Builds a paginated sell page with select menu + prev/next buttons.
 * Shared by MarketCommand.handleSell and MarketSellPageButton.
 */
export async function buildSellPage(
  discordId: string,
  page: number
): Promise<{ content: string; components: ActionRowBuilder<any>[] }> {
  const res = await apiFetch(Routes.inventory(discordId));
  const body = await res.json();

  if (!res.ok || !body.success) {
    return { content: '❌ Failed to load inventory.', components: [] };
  }

  const inventory: IInventoryItem[] = body.data?.inventory || [];

  if (inventory.length === 0) {
    return {
      content: '🎒 Your inventory is empty — nothing to sell!',
      components: []
    };
  }

  const sellable = inventory.filter((inv: IInventoryItem) => {
    if (inv.isLocked) return false;
    const def = ItemManager.get(inv.itemId);
    if (!def || def.type === 'Consumable') return false;
    return true;
  });

  if (sellable.length === 0) {
    return {
      content:
        '❌ No sellable items. Unlock or acquire non-consumable items first.',
      components: []
    };
  }

  const totalPages = Math.ceil(sellable.length / SELL_PAGE_SIZE);
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const pageItems = sellable.slice(
    safePage * SELL_PAGE_SIZE,
    (safePage + 1) * SELL_PAGE_SIZE
  );

  const options: StringSelectMenuOptionBuilder[] = [];
  for (const inv of pageItems) {
    const def = ItemManager.get(inv.itemId);
    if (!def) continue;

    const enhTag = inv.enhanceLevel > 0 ? ` +${inv.enhanceLevel}` : '';
    const modTag =
      inv.enhanceLevel > 0 || inv.statOverrides || inv.affixOverrides
        ? ' ✨'
        : '';
    const value = def.value || 0;

    options.push(
      new StringSelectMenuOptionBuilder()
        .setLabel(`${def.name}${enhTag} (x${inv.quantity})${modTag}`)
        .setDescription(
          `${def.rarity} ${def.type} • Lvl ${def.level} • Base: ${value.toLocaleString()}g`
        )
        .setValue(`${inv._id}:${inv.itemId}:${inv.quantity}`)
    );
  }

  const components: ActionRowBuilder<any>[] = [];

  if (options.length > 0) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('mkt_sell_select')
      .setPlaceholder('Select an item to list...')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(options);

    components.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(selectMenu)
    );
  }

  if (totalPages > 1) {
    const navRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId(`mkt_sell_page:${safePage - 1}`)
        .setLabel('◀ Prev')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(safePage <= 0),
      new ButtonBuilder()
        .setCustomId('mkt_sell_noop')
        .setLabel(`Page ${safePage + 1} / ${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`mkt_sell_page:${safePage + 1}`)
        .setLabel('Next ▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(safePage >= totalPages - 1)
    );
    components.push(navRow);
  }

  const header =
    totalPages > 1
      ? `🏪 **Select an item to sell** (Page ${safePage + 1}/${totalPages} • ${sellable.length} items)`
      : `🏪 **Select an item to sell** (${sellable.length} items)`;

  return { content: header, components };
}

// --- HELPERS ---

function buildMarketButtons(
  listings: MarketListing[],
  config: MarketPageConfig,
  filterKey: string,
  mode: 'browse' | 'my_listings'
): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  if (listings.length > 0) {
    const isBrowse = mode === 'browse';
    const chunks = chunkArray(listings, 4);

    for (const chunk of chunks.slice(0, 2)) {
      const row = new ActionRowBuilder<ButtonBuilder>();

      for (const listing of chunk) {
        const globalIndex = listings.indexOf(listing);

        if (isBrowse) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`mkt_buy:${listing.listingId}`)
              .setLabel(`🛒 ${globalIndex + 1}`)
              .setStyle(ButtonStyle.Success)
          );
        } else {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`mkt_cancel:${listing.listingId}`)
              .setLabel(`❌ ${globalIndex + 1}`)
              .setStyle(ButtonStyle.Danger)
          );
        }
      }

      rows.push(row);
    }
  }

  if (config.totalPages > 1) {
    const navRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId(`mkt_prev:${config.page}:${filterKey}:${mode}`)
        .setLabel('◀ Prev')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(config.page <= 1),
      new ButtonBuilder()
        .setCustomId(`mkt_next:${config.page}:${filterKey}:${mode}`)
        .setLabel('Next ▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(config.page >= config.totalPages)
    );
    rows.push(navRow);
  }

  return rows;
}
