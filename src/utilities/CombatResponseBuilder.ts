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

  // Determine if combat buttons should be shown
  const isCombatData = data as ICombatJSON;
  const isStepData = data as IStepJSON;
  const rewards = isStepData.rewards;

  const showButtons =
    (isCombatData.combatEnded === false) ||  // Active combat (attack/flee result)
    (isStepData.combatTrigger === true);      // New encounter from explore

  if (showButtons) {
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
  } else if (rewards.levelsGained >= 1) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    const points = rewards.levelsGained * 2;
    row.addComponents(new ButtonBuilder().setCustomId(`skillpoints:${points}`).setLabel(`⭐ Spend Skillpoints ${points}`).setStyle(ButtonStyle.Secondary));

    components.push(row);
  }

  return { embeds: [embed], files: [attachment], components };
}