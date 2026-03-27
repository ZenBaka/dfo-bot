import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  CommandInteraction,
  MessageComponentInteraction,
  ComponentType,
  AttachmentBuilder,
  MessageActionRowComponentBuilder
} from 'discord.js';

export default class PaginatorBuilder {
  private pages: EmbedBuilder[] = [];
  private files: AttachmentBuilder[] = [];
  private extraRows: ActionRowBuilder<MessageActionRowComponentBuilder>[][] = [];
  private idleTimeout: number = 60000;
  private targetUserId: string | null = null;
  private isEphemeral: boolean = false;

  public addPage(embed: EmbedBuilder): this {
    this.pages.push(embed);
    return this;
  }

  public setPages(embeds: EmbedBuilder[]): this {
    this.pages = embeds;
    return this;
  }

  public setFiles(files: AttachmentBuilder[]): this {
    this.files = files;
    return this;
  }

  /**
   * Set additional action rows that appear ABOVE the pagination buttons.
   * Indexed per page — extraRows[0] = rows for page 0, etc.
   * Discord max 5 rows total; pagination takes 1, so up to 4 extra per page.
   */
  public setExtraRows(rows: ActionRowBuilder<MessageActionRowComponentBuilder>[][]): this {
    this.extraRows = rows;
    return this;
  }

  public setIdleTimeout(ms: number): this {
    this.idleTimeout = ms;
    return this;
  }

  public setTargetUser(userId: string): this {
    this.targetUserId = userId;
    return this;
  }

  public setEphemeral(ephemeral: boolean): this {
    this.isEphemeral = ephemeral;
    return this;
  }

  public async start(interaction: CommandInteraction | MessageComponentInteraction): Promise<void> {
    if (this.pages.length === 0) {
      throw new Error('[PaginatorBuilder] Cannot start a paginator with 0 pages.');
    }

    let currentPage = 0;

    const firstBtn = new ButtonBuilder().setCustomId('page_first').setLabel('⏪').setStyle(ButtonStyle.Secondary);
    const prevBtn = new ButtonBuilder().setCustomId('page_prev').setLabel('◀').setStyle(ButtonStyle.Primary);
    const nextBtn = new ButtonBuilder().setCustomId('page_next').setLabel('▶').setStyle(ButtonStyle.Primary);
    const lastBtn = new ButtonBuilder().setCustomId('page_last').setLabel('⏩').setStyle(ButtonStyle.Secondary);

    const getNavRow = (index: number) => {
      return new ActionRowBuilder<ButtonBuilder>().addComponents(
        firstBtn.setDisabled(index === 0),
        prevBtn.setDisabled(index === 0),
        nextBtn.setDisabled(index === this.pages.length - 1),
        lastBtn.setDisabled(index === this.pages.length - 1)
      );
    };

    const getComponents = (index: number): ActionRowBuilder<MessageActionRowComponentBuilder>[] => {
      const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];
      const pageExtras = this.extraRows[index] ?? [];
      rows.push(...pageExtras);
      if (this.pages.length > 1) rows.push(getNavRow(index));
      return rows.slice(0, 5);
    };

    const getEmbed = (index: number) => {
      const originalEmbed = this.pages[index];
      const embed = EmbedBuilder.from(originalEmbed);
      const currentFooter = originalEmbed.data.footer?.text || '';
      return embed.setFooter({ 
        text: (currentFooter ? `${currentFooter} | Page ${index + 1} of ${this.pages.length}` : `Page ${index + 1} of ${this.pages.length}`) + ' | ⚔️ DFO Cross-Platform',
        iconURL: originalEmbed.data.footer?.icon_url
      });
    };

    const messagePayload: any = {
      embeds: [getEmbed(currentPage)],
      components: getComponents(currentPage),
      files: this.files.length > 0 ? [this.files[currentPage]] : [],
      ephemeral: this.isEphemeral
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(messagePayload);
    } else {
      await interaction.reply(messagePayload);
    }

    const message = await interaction.fetchReply();

    if (this.pages.length <= 1 && this.extraRows.length === 0) return;

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: this.idleTimeout,
      filter: (i) => {
        if (!i.customId.startsWith('page_')) return false;
        if (this.targetUserId && i.user.id !== this.targetUserId) {
          i.reply({ content: 'You cannot use these buttons.', ephemeral: true });
          return false;
        }
        return true;
      }
    });

    collector.on('collect', async (i) => {
      collector.resetTimer();
      switch (i.customId) {
        case 'page_first': currentPage = 0; break;
        case 'page_prev': currentPage = Math.max(0, currentPage - 1); break;
        case 'page_next': currentPage = Math.min(this.pages.length - 1, currentPage + 1); break;
        case 'page_last': currentPage = this.pages.length - 1; break;
      }
      await i.update({
        embeds: [getEmbed(currentPage)],
        components: getComponents(currentPage),
        files: this.files.length > 0 ? [this.files[currentPage]] : [] 
      });
    });

    collector.on('end', async () => {
      const finalComponents = getComponents(currentPage);
      finalComponents.forEach(row => row.components.forEach(c => c.setDisabled(true)));
      try { await interaction.editReply({ components: finalComponents }); } catch (e) {}
    });
  }
}