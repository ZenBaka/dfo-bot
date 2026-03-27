import { ContainerBuilder } from 'discord.js';
import { type IItemJSON, RARITY_COLORS } from '../../interfaces/IItemJSON';

export default class ItemLookupContainer {
  private data: IItemJSON;

  constructor(data: IItemJSON) {
    this.data = data;
  }

  public build(): ContainerBuilder {
    const container = new ContainerBuilder().setAccentColor(
      RARITY_COLORS[this.data.rarity]
    );

    container.addTextDisplayComponents(
      (textDisplay) => textDisplay.setContent(`## LVL${this.data.level} ${this.data.name}`),
      (textDisplay) => textDisplay.setContent(
        `-# *${this.data.rarity} ${this.data.slot === 'None' ? '' : this.data.slot} ${this.data.type}*`
      ),
      (textDisplay) => textDisplay.setContent(`*${this.data.description}*`),
      (textDisplay) => textDisplay.setContent(
        `-# **Stats:**\n**ATK:** \`${this.data.stats.atk.toLocaleString()}\`, **DEF:** \`${this.data.stats.def.toLocaleString()}\`, **HP:** \`${this.data.stats.hp.toLocaleString()}\``
      )
    );

    if (this.data.affixes) {
      for (const affix of this.data.affixes) {
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(
          `**${affix.type}** \`${affix.value}${affix.type === 'THORNS' ? '' : '%'}\``
        )
        );
      }
    }

    container.addSeparatorComponents((s) => s);

    container.addTextDisplayComponents((textDisplay) => textDisplay.setContent('-# ⚔️ DFO Cross-Platform Integration')
    );

    return container;
  }
}
