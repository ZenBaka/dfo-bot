import {
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  type Client,
  Colors,
  EmbedBuilder,
  MessageFlags
} from 'discord.js';
import SlashCommand from '../structures/SlashCommand';
import * as ItemManager from '../managers/ItemManager';
import PaginatorBuilder from '../utilities/PaginatorBuilder';
import ItemLookupContainer from '../structures/containers/ItemLookupContainer';
import { apiFetch } from '../utilities/ApiClient';
import * as Routes from '../utilities/Routes';
import { type IScenarioJSON } from '../interfaces/IScenarioJSON';
import ScenarioLookupContainer from '../structures/containers/ScenarioLookupContainer';
import { type INPCJSON } from '../interfaces/INPCJSON';
import NPCLookupContainer from '../structures/containers/NPCLookupContainer';

const typeOptions = [
  { name: 'Item', value: 'item' },
  { name: 'Scenario', value: 'scenario' },
  { name: 'NPC', value: 'npc' }
];

export default class LookupCommand extends SlashCommand {
  constructor() {
    super({
      name: 'lookup',
      description: 'Lookup specific objects in the game',
      category: 'Moderator',
      cooldown: 3,
      isGlobalCommand: false
    });

    this.builder.addStringOption((o) => o
      .setName('type')
      .setDescription('Select a type')
      .setChoices(typeOptions)
      .setRequired(true)
    );
    this.builder.addIntegerOption((o) => o
      .setName('id')
      .setDescription('Enter an id to lookup. Use -1 for all')
      .setMinValue(-1)
      .setRequired(true)
      .setAutocomplete(true)
    );
  }

  /**
   * Autocomplete handler (#9) — suggests items by name when type is 'item'
   */
  public async autocomplete(
    interaction: AutocompleteInteraction,
    client: Client
  ): Promise<void> {
    const type = interaction.options.getString('type');
    const focused = interaction.options.getFocused(true);

    if (focused.name !== 'id' || type !== 'item') {
      await interaction.respond([]);
      return;
    }

    const query = String(focused.value).toLowerCase();
    const items = Array.from(ItemManager.cache.values());

    // Filter by name match, return up to 25 suggestions (Discord limit)
    const matches = items
      .filter(
        (item) => item.name.toLowerCase().includes(query) ||
          String(item.itemId).startsWith(query)
      )
      .slice(0, 25)
      .map((item) => ({
        name: `[${item.itemId}] ${item.name} (${item.rarity} Lvl ${item.level})`,
        value: item.itemId
      }));

    await interaction.respond(matches);
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    client: Client
  ): Promise<void> {
    await interaction.deferReply();

    const choice = interaction.options.getString('type', true);
    const id = interaction.options.getInteger('id', true);

    switch (choice) {
    case 'item':
      if (id === -1) {
        const items = Array.from(ItemManager.cache.values());
        const ITEMS_PER_PAGE = 10;
        const pages: EmbedBuilder[] = [];

        for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
          const chunk = items.slice(i, i + ITEMS_PER_PAGE);
          let descriptionText = '';

          for (const item of chunk) {
            descriptionText += `**LVL ${item.level} ${item.name} ID:** \`${item.itemId}\`\n`;
            descriptionText += `└ ${item.rarity} ${item.type} | **HP:** \`${item.stats.hp.toLocaleString()}\`; **ATK:** \`${item.stats.atk.toLocaleString()}\`; **DEF:** \`${item.stats.def.toLocaleString()}\`\n`;
            if (item.affixes) {
              let textToAdd = '';
              for (const affix of item.affixes) {
                textToAdd +=
                    affix.type === 'THORNS'
                      ? ` **${affix.type}:** \`${affix.value.toLocaleString()}\` |`
                      : ` **${affix.type}:** \`${affix.value.toLocaleString()}%\` |`;
              }
              if (textToAdd !== '')
                descriptionText += `‎ ‎ ‎ ‎ └ ${textToAdd}\n\n`;
              else descriptionText += '\n';
            }
          }

          pages.push(
            new EmbedBuilder()
              .setColor(Colors.Green)
              .setTitle('Item Manager')
              .setDescription(descriptionText)
          );
        }

        await new PaginatorBuilder()
          .setPages(pages)
          .setTargetUser(interaction.user.id)
          .setIdleTimeout(60_000)
          .start(interaction);
      } else {
        const item = ItemManager.get(id);
        if (!item) {
          await interaction.editReply({
            content: 'No item with that id exists!'
          });
          return;
        }
        await interaction.editReply({
          components: [new ItemLookupContainer(item).build()],
          flags: MessageFlags.IsComponentsV2
        });
      }
      break;

    case 'scenario':
      if (id === -1) {
        const res = await apiFetch(Routes.scenarios());
        if (!res.ok) throw new Error('API Error!');
        const { data }: { data: IScenarioJSON[] } = await res.json();

        const ITEMS_PER_PAGE = 10;
        const pages: EmbedBuilder[] = [];

        for (let i = 0; i < data.length; i += ITEMS_PER_PAGE) {
          const chunk = data.slice(i, i + ITEMS_PER_PAGE);
          let descriptionText = '';
          for (const scenario of chunk) {
            descriptionText += `📜 \`\`\`${scenario.description.length > 128 ? `${scenario.description.substring(0, 125)}...` : scenario.description}\`\`\`\n`;
            descriptionText += `└ **ID:** \`${scenario.id}\` | **Author:** \`${scenario.createdBy}\`\n\n`;
          }
          pages.push(
            new EmbedBuilder()
              .setTitle('Scenario Manager')
              .setDescription(descriptionText)
          );
        }

        await new PaginatorBuilder()
          .setPages(pages)
          .setTargetUser(interaction.user.id)
          .setIdleTimeout(60_000)
          .start(interaction);
      } else {
        const res = await apiFetch(Routes.scenario(id));
        if (res.status === 404) {
          await interaction.editReply({
            content: 'No scenario was found for this id!'
          });
          return;
        }
        if (!res.ok) throw new Error('API Error!');
        const { data }: { data: IScenarioJSON } = await res.json();
        await interaction.editReply({
          components: [new ScenarioLookupContainer(data).build()],
          flags: MessageFlags.IsComponentsV2
        });
      }
      break;

    case 'npc':
      if (id === -1) {
        const res = await apiFetch(Routes.npcs());
        if (!res.ok) throw new Error('API Error!');
        const { data }: { data: INPCJSON[] } = await res.json();

        const ITEMS_PER_PAGE = 10;
        const pages: EmbedBuilder[] = [];

        for (let i = 0; i < data.length; i += ITEMS_PER_PAGE) {
          const chunk = data.slice(i, i + ITEMS_PER_PAGE);
          let descriptionText = '';
          for (const npc of chunk) {
            descriptionText += `💀 (ID: \`${npc.id}\`) **${npc.name}**\n`;
            descriptionText += `└ ${npc.description.length > 128 ? `${npc.description.substring(0, 125)}...` : npc.description}\n\n`;
          }
          pages.push(
            new EmbedBuilder()
              .setTitle('NPC Manager')
              .setDescription(descriptionText)
          );
        }

        await new PaginatorBuilder()
          .setPages(pages)
          .setTargetUser(interaction.user.id)
          .setIdleTimeout(60_000)
          .start(interaction);
      } else {
        const res = await apiFetch(Routes.npc(id));
        if (!res.ok) throw new Error('API Error!');
        const { success, data }: { success: boolean; data: INPCJSON } =
            await res.json();
        if (!success) {
          await interaction.editReply({
            content: 'No NPC was found for the provided ID!'
          });
          return;
        }
        await interaction.editReply({
          components: [new NPCLookupContainer(data).build()],
          flags: MessageFlags.IsComponentsV2
        });
      }
      break;
    }
  }
}
