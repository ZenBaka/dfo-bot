import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { ICombatJSON } from '../interfaces/ICombatJSON';
import { IStepJSON } from '../interfaces/IStepJSON';
import AdventureImageBuilder from './AdventureImageBuilder';

export interface CombatResponse {
  embeds: EmbedBuilder[];
  files: AttachmentBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
}

/**
 * Builds a complete combat/adventure response payload from API data.
 * Used by AttackCommand, FleeCommand, ExploreCommand, and all combat buttons.
 *
 * Single source of truth for the combat UI — change it here, changes everywhere.
 */
export async function buildCombatResponse(data: ICombatJSON | IStepJSON): Promise<CombatResponse> {
  const imageBuffer = await AdventureImageBuilder.build(data);
  const attachment = new AttachmentBuilder(imageBuffer, { name: 'adventure.png' });

  const hasEnemy = !!(data as any).enemy;
  const embed = new EmbedBuilder()
    .setColor(hasEnemy ? '#ef4444' : '#10b981')
    .setImage('attachment://adventure.png');

  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  const isCombatData = data as ICombatJSON;
  const isStepData = data as IStepJSON;
  const rewards = isStepData.rewards;
  const playerStats = isStepData.playerStats;

  const showCombatButtons =
    (isCombatData.combatEnded === false) ||
    (isStepData.combatTrigger === true);

  if (showCombatButtons) {
    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId('embedAttack')
        .setLabel('Attack')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('embedFlee')
        .setLabel('Flee')
        .setStyle(ButtonStyle.Secondary),
    );
    components.push(row);
  } else {
    // Post-combat / post-explore actions
    const actionRow = new ActionRowBuilder<ButtonBuilder>();
    let hasActions = false;

    // Skill points button if leveled up
    if (rewards?.levelsGained >= 1) {
      const points = rewards.levelsGained * 2;
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`skillpoints:${points}`)
          .setLabel(`⭐ Spend Skillpoints (${points})`)
          .setStyle(ButtonStyle.Secondary)
      );
      hasActions = true;
    }

    // Rest button if HP < max and not dead
    if (playerStats && playerStats.hp > 0 && playerStats.hp < playerStats.maxHp) {
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId('rest')
          .setLabel('🏨 Rest at Inn')
          .setStyle(ButtonStyle.Primary)
      );
      hasActions = true;
    }

    // Explore again button
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId('explore_again')
        .setLabel('🗺️ Explore')
        .setStyle(ButtonStyle.Success)
    );
    hasActions = true;

    if (hasActions) {
      components.push(actionRow);
    }
  }

  // Build description with toll and chest info
  const descParts: string[] = [];

  if (rewards?.toll && rewards.toll > 0) {
    descParts.push(`🪙 Zone toll: -${rewards.toll.toLocaleString()}g`);
  }

  if (rewards?.chestDrop) {
    descParts.push(`📦 Found a **${rewards.chestDrop} Chest** while exploring!`);
  }

  if (descParts.length > 0) {
    embed.setDescription(descParts.join('\n'));
  }

  return { embeds: [embed], files: [attachment], components };
}