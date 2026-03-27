import { ContainerBuilder } from 'discord.js';
import { type ICombatJSON } from '../../interfaces/ICombatJSON';

export default class AttackContainer {
  private data: ICombatJSON;

  constructor(data: ICombatJSON) {
    this.data = data;
  }

  public build(): ContainerBuilder {
    const container = new ContainerBuilder();

    container.setAccentColor(
      this.data.victory ? 0x10b981 : this.data.combatEnded ? 0x6b7280 : 0xef4444
    );

    const cleanFlavorText = this.data.flavorText.replace(
      /\[([^\]]+)\]\(color:#[0-9a-fA-F]+\)/g,
      '**$1**'
    );

    container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(cleanFlavorText)
    );

    if (!this.data.combatEnded && this.data.enemy) {
      container.addSeparatorComponents((s) => s);

      container.addTextDisplayComponents(
        (textDisplay) => textDisplay.setContent(
          `**Your HP:** ❤️ \`${this.data.playerStats.stats.hp.toLocaleString()}/${this.data.playerStats.maxHp?.toLocaleString()}\``
        ),
        (textDisplay) => textDisplay.setContent(
          `**${this.data.enemy!.name}'s HP:** ❤️ \`${Math.max(0, this.data.enemy!.currentHp)}/${this.data.enemy!.maxHp}\``
        ),
        (textDisplay) => textDisplay.setContent(`-# Use /attack to strike again!`)
      );
    }

    if (this.data.victory && this.data.rewards) {
      container.addSeparatorComponents((s) => s);
      const rewardText = [];
      if (this.data.rewards.xp)
        rewardText.push(`✨ +${this.data.rewards.xp.toLocaleString()} XP`);
      if (this.data.rewards.gold)
        rewardText.push(`🪙 +${this.data.rewards.gold.toLocaleString()} Gold`);
      if (this.data.rewards.item)
        rewardText.push(`🎒 Looted: **${this.data.rewards.item.name}**`);

      for (const reward of rewardText) {
        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(reward)
        );
      }
    }

    container.addSeparatorComponents((s) => s);

    container.addTextDisplayComponents((textDisplay) => textDisplay.setContent('-# ⚔️ DFO Cross-Platform Integration')
    );

    return container;
  }
}
