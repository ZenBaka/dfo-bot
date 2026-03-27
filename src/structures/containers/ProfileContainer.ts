import { ContainerBuilder } from 'discord.js';
import { type IPlayerJSON } from '../../interfaces/IPlayerJSON';

export default class ProfileContainer {
  private data: IPlayerJSON;

  constructor(data: IPlayerJSON) {
    this.data = data;
  }

  public build(): ContainerBuilder {
    const container = new ContainerBuilder();

    container.addSectionComponents((section) => section
      .addTextDisplayComponents(
        (textDisplay) => textDisplay.setContent(`**Username:** \`${this.data.username}\``),
        (textDisplay) => textDisplay.setContent(
          `**Level:** \`${this.data.level.toLocaleString()}\``
        ),
        (textDisplay) => textDisplay.setContent(
          `**Experience:** \`${this.data.experience.toLocaleString()}\``
        )
      )
      .setThumbnailAccessory((tb) => tb.setURL(
        `https://cdn.discordapp.com/avatars/${this.data.id}/${this.data.avatar}.png`
      )
      )
    );

    container.addTextDisplayComponents(
      (textDisplay) => textDisplay.setContent(`**Privilege:** \`${this.data.privilege}\``),
      (textDisplay) => textDisplay.setContent(
        `**Coins:** \`${this.data.coins.toLocaleString()}\``
      ),
      (textDisplay) => textDisplay.setContent(
        `**HP:** \`${this.data.stats.hp}/${this.data.maxHp ?? 0}\``
      ),
      (textDisplay) => textDisplay.setContent(
        `**ATK:** \`${this.data.stats.atk.toLocaleString()}\``
      ),
      (textDisplay) => textDisplay.setContent(
        `**DEF:** \`${this.data.stats.def.toLocaleString()}\``
      )
    );

    container.addSeparatorComponents((separator) => separator);

    container.addTextDisplayComponents(
      (textDisplay) => textDisplay.setContent(
        `**Days Passed:** \`${this.data.statistics.daysPassed.toLocaleString()}\``
      ),
      (textDisplay) => textDisplay.setContent(
        `**Enemies Defeated:** \`${this.data.statistics.enemiesDefeated.toLocaleString()}\``
      ),
      (textDisplay) => textDisplay.setContent(
        `**Players Defeated:** \`${this.data.statistics.playersDefeated.toLocaleString()}\``
      ),
      (textDisplay) => textDisplay.setContent(
        `**Times Died:** \`${this.data.statistics.timesDied.toLocaleString()}\``
      ),
      (textDisplay) => textDisplay.setContent(
        `**Quests Done:** \`${this.data.statistics.questsDone.toLocaleString()}\``
      )
    );

    container.addSeparatorComponents((separator) => separator);

    container.addTextDisplayComponents((textDisplay) => textDisplay.setContent('-# ⚔️ DFO Cross-Platform Integration')
    );

    return container;
  }
}
