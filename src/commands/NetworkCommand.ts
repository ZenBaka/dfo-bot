import {
  type ChatInputCommandInteraction,
  type Client,
  Colors,
  EmbedBuilder,
  MessageFlags,
  ContainerBuilder
} from 'discord.js';
import SlashCommand from '../structures/SlashCommand';
import PaginatorBuilder from '../utilities/PaginatorBuilder';

interface ClusterInfo {
  id: number;
  shards: number[];
  shardCount: number;
  ping: number;
  guilds: number;
  users: number;
  uptime: number | null;
}

interface GuildInfo {
  id: string;
  name: string;
  memberCount: number;
  clusterId: number;
  ownerId: string;
  joinedAt: number | null;
}

const options = [
  { name: 'Overview', value: 'overview' },
  { name: 'Cluster', value: 'shard' },
  { name: 'Guild', value: 'guild' }
];

export default class NetworkCommand extends SlashCommand {
  constructor() {
    super({
      name: 'network',
      description: 'Track all clusters and guilds the bot is connected to',
      category: 'Moderator',
      cooldown: 5,
      isGlobalCommand: false
    });

    this.builder.addStringOption((o) => o
      .setName('type')
      .setDescription('Select a view type')
      .setChoices(options)
      .setRequired(true)
    );
    this.builder.addStringOption((o) => o
      .setName('id')
      .setDescription(
        "Enter a Cluster ID or Guild ID. Use 'all' to view everything."
      )
      .setRequired(false)
    );
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    client: Client
  ): Promise<void> {
    await interaction.deferReply();

    const choice = interaction.options.getString('type', true);
    const id = interaction.options.getString('id') || 'all';

    switch (choice) {
    case 'overview': {
      const clusters = await this.getClusters(client);
      const totalGuilds = clusters.reduce((acc, s) => acc + s.guilds, 0);
      const totalUsers = clusters.reduce((acc, s) => acc + s.users, 0);
      const avgPing =
          clusters.reduce((acc, s) => acc + s.ping, 0) / clusters.length;
      const totalShards = clusters.reduce((acc, s) => acc + s.shardCount, 0);

      const container = new ContainerBuilder()
        .setAccentColor(Colors.Blurple)
        .addTextDisplayComponents((text) => text.setContent(`# 🌐 Global Network Overview`)
        )
        .addSeparatorComponents((sep) => sep.setDivider(true))
        .addTextDisplayComponents((text) => text.setContent(
          `**Clusters:** \`${clusters.length}\`\n**Total Shards:** \`${totalShards}\`\n**Total Guilds:** \`${totalGuilds.toLocaleString()}\`\n**Total Users:** \`${totalUsers.toLocaleString()}\`\n**Average Latency:** \`${Math.round(avgPing)}ms\``
        )
        );

      await interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
      break;
    }

    case 'shard': {
      const clusters = await this.getClusters(client);

      if (id.toLowerCase() === 'all') {
        const ITEMS_PER_PAGE = 10;
        const pages: EmbedBuilder[] = [];

        for (let i = 0; i < clusters.length; i += ITEMS_PER_PAGE) {
          const chunk = clusters.slice(i, i + ITEMS_PER_PAGE);
          let descriptionText = '';

          for (const cluster of chunk) {
            descriptionText += `💎 **Cluster #${cluster.id}** | **Ping:** \`${cluster.ping}ms\` | **Shards:** \`${cluster.shards.join(', ')}\`\n`;
            descriptionText += `└ **Guilds:** \`${cluster.guilds.toLocaleString()}\` | **Users:** \`${cluster.users.toLocaleString()}\`\n\n`;
          }

          pages.push(
            new EmbedBuilder()
              .setColor(Colors.Blue)
              .setTitle('Network Manager: Clusters')
              .setDescription(descriptionText)
          );
        }

        const paginator = new PaginatorBuilder()
          .setPages(pages)
          .setTargetUser(interaction.user.id)
          .setIdleTimeout(60_000);

        await paginator.start(interaction);
      } else {
        const targetCluster = clusters.find((s) => s.id.toString() === id);
        if (!targetCluster) {
          await interaction.editReply({
            content: `❌ No cluster could be found with the ID: \`${id}\``
          });
          return;
        }

        const uptimeMins = Math.floor((targetCluster.uptime || 0) / 60000);
        const uptimeHours = Math.floor(uptimeMins / 60);

        const container = new ContainerBuilder()
          .setAccentColor(Colors.Blue)
          .addTextDisplayComponents((text) => text.setContent(`# 💎 Cluster #${targetCluster.id}`)
          )
          .addSeparatorComponents((sep) => sep.setDivider(true))
          .addTextDisplayComponents((text) => text.setContent(
            `**Status:** \`Online\`\n**Ping:** \`${targetCluster.ping}ms\`\n**Internal Shards:** \`${targetCluster.shards.join(', ')}\`\n**Guilds Hosted:** \`${targetCluster.guilds.toLocaleString()}\`\n**Users Tracked:** \`${targetCluster.users.toLocaleString()}\`\n**Uptime:** \`${uptimeHours}h ${uptimeMins % 60}m\``
          )
          );

        await interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2
        });
      }
      break;
    }

    case 'guild': {
      const guilds = await this.getGuilds(client);

      if (id.toLowerCase() === 'all') {
        const ITEMS_PER_PAGE = 10;
        const pages: EmbedBuilder[] = [];

        for (let i = 0; i < guilds.length; i += ITEMS_PER_PAGE) {
          const chunk = guilds.slice(i, i + ITEMS_PER_PAGE);
          let descriptionText = '';

          for (const guild of chunk) {
            descriptionText += `🛡️ **${guild.name}** (ID: \`${guild.id}\`)\n`;
            descriptionText += `└ **Cluster:** \`${guild.clusterId}\` | **Members:** \`${guild.memberCount.toLocaleString()}\`\n\n`;
          }

          pages.push(
            new EmbedBuilder()
              .setColor(Colors.Purple)
              .setTitle('Network Manager: Guilds')
              .setDescription(descriptionText)
          );
        }

        const paginator = new PaginatorBuilder()
          .setPages(pages)
          .setTargetUser(interaction.user.id)
          .setIdleTimeout(60_000);

        await paginator.start(interaction);
      } else {
        const targetGuild = guilds.find((g) => g.id === id);
        if (!targetGuild) {
          await interaction.editReply({
            content: `❌ No guild could be found with the ID: \`${id}\``
          });
          return;
        }

        const joinedTimestamp = targetGuild.joinedAt
          ? `<t:${Math.floor(targetGuild.joinedAt / 1000)}:R>`
          : 'Unknown';

        const container = new ContainerBuilder()
          .setAccentColor(Colors.Purple)
          .addTextDisplayComponents((text) => text.setContent(`# 🛡️ Guild Details\n**${targetGuild.name}**`)
          )
          .addSeparatorComponents((sep) => sep.setDivider(true))
          .addTextDisplayComponents((text) => text.setContent(
            `**Guild ID:** \`${targetGuild.id}\`\n**Hosted on Cluster:** \`${targetGuild.clusterId}\`\n**Total Members:** \`${targetGuild.memberCount.toLocaleString()}\`\n**Owner ID:** \`${targetGuild.ownerId}\`\n**Joined Bot:** ${joinedTimestamp}`
          )
          );

        await interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2
        });
      }
      break;
    }
    }
  }

  // --- HELPER METHODS ---

  /**
   * Reaches across all clusters via hybrid sharding broadcastEval.
   */
  private async getClusters(client: Client): Promise<ClusterInfo[]> {
    const cluster = (client as any).cluster;
    if (cluster) {
      const results: ClusterInfo[] = await cluster.broadcastEval((c: any) => ({
        id: c.cluster?.id ?? 0,
        shards: c.cluster?.ids?.shardList ?? c.shard?.ids ?? [0],
        shardCount: c.ws.shards?.size ?? 1,
        ping: c.ws.ping,
        guilds: c.guilds.cache.size,
        users: c.guilds.cache.reduce(
          (acc: number, guild: any) => acc + guild.memberCount,
          0
        ),
        uptime: c.uptime
      }));
      return results;
    }
    return [
      {
        id: 0,
        shards: [0],
        shardCount: 1,
        ping: client.ws.ping,
        guilds: client.guilds.cache.size,
        users: client.guilds.cache.reduce(
          (acc, guild) => acc + guild.memberCount,
          0
        ),
        uptime: client.uptime
      }
    ];
  }

  /**
   * Reaches across all clusters to build a unified list of every guild.
   */
  private async getGuilds(client: Client): Promise<GuildInfo[]> {
    const cluster = (client as any).cluster;
    if (cluster) {
      const results: GuildInfo[][] = await cluster.broadcastEval((c: any) => c.guilds.cache.map((g: any) => ({
        id: g.id,
        name: g.name,
        memberCount: g.memberCount,
        clusterId: c.cluster?.id ?? 0,
        ownerId: g.ownerId,
        joinedAt: g.joinedTimestamp
      }))
      );
      return results.flat();
    }
    return client.guilds.cache.map((g) => ({
      id: g.id,
      name: g.name,
      memberCount: g.memberCount,
      clusterId: 0,
      ownerId: g.ownerId,
      joinedAt: g.joinedTimestamp
    }));
  }
}
