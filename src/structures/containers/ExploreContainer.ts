import { ContainerBuilder } from 'discord.js';
import { type IStepJSON } from '../../interfaces/IStepJSON';

export default class ExploreContainer {
  private data: IStepJSON;

  constructor(data: IStepJSON) {
    this.data = data;
  }

  public build(): ContainerBuilder {
    const container = new ContainerBuilder();

    container.setAccentColor(
      this.data.combatTrigger || this.data.inCombat ? 0xef4444 : 0x3b82f6
    );

    const cleanFlavorText = this.data.flavorText.replace(
      /\[([^\]]+)\]\(color:#[0-9a-fA-F]+\)/g,
      '**$1**'
    );

    container.addTextDisplayComponents(
      (textDisplay) => textDisplay.setContent(cleanFlavorText),
      (textDisplay) => textDisplay.setContent(
        `-# **ID:** \`${this.data.scenarioId}\` | **Author:** \`${this.data.scenarioAuthor}\``
      )
    );

    if (this.data.enemy) {
      const enemy = this.data.enemy;
      container.addSeparatorComponents((s) => s);
      container.addTextDisplayComponents(
        (textDisplay) => textDisplay.setContent(
          `**Enemy**: \`LVL${enemy.level.toLocaleString()} ${enemy.name}\``
        ),
        (textDisplay) => textDisplay.setContent(
          `**HP:** \`${enemy.currentHp.toLocaleString()}/${enemy.maxHp.toLocaleString()}\``
        ),
        (textDisplay) => textDisplay.setContent(`**ATK:** \`${enemy.atk.toLocaleString()}\``),
        (textDisplay) => textDisplay.setContent(`**DEF:** \`${enemy.def.toLocaleString()}\``),
        (textDisplay) => textDisplay.setContent(`-# Use the /attack command to fight`)
      );

      container.addSeparatorComponents((s) => s);

      container.addTextDisplayComponents((textDisplay) => textDisplay.setContent('-# ⚔️ DFO Cross-Platform Integration')
      );

      return container;
    } else if (this.data.rewards) {
      const stats = this.data.playerStats;
      const level = stats.level ?? 1;
      const experience = stats.exp ?? 0;
      const expRequired = stats.expRequired ?? 1;

      const rewardText = [];
      if (this.data.rewards.xp)
        rewardText.push(`✨ +${this.data.rewards.xp} XP`);
      if (this.data.rewards.gold)
        rewardText.push(`🪙 +${this.data.rewards.gold} Gold`);
      if (this.data.rewards.item)
        rewardText.push(
          `🎒 Found: **${this.data.rewards.item.name}** (${this.data.rewards.item.rarity})`
        );
      if (this.data.rewards.levelsGained > 0)
        rewardText.push('🆙 **LEVEL UP!**');

      if (rewardText.length >= 1) {
        container.addSeparatorComponents((s) => s);
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(
          `-# **Lvl:** \`${level.toLocaleString()}\` | **Exp:** \`${experience.toLocaleString()}/${expRequired.toLocaleString()}\``
        )
        );
      }

      for (const text of rewardText) {
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(text)
        );
      }

      container.addSeparatorComponents((s) => s);

      container.addTextDisplayComponents((textDisplay) => textDisplay.setContent('-# ⚔️ DFO Cross-Platform Integration')
      );

      return container;
    }

    container.addSeparatorComponents((s) => s);

    container.addTextDisplayComponents((textDisplay) => textDisplay.setContent('-# ⚔️ DFO Cross-Platform Integration')
    );

    return container;
  }
}
