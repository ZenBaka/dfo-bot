import { ButtonInteraction, Client, LabelBuilder, ModalBuilder, TextDisplayBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import Button from "../../structures/Button";

export default class SkillPointsButton extends Button {
  constructor() { super({ customId: "skillpoints", cooldown: 3, isAuthorOnly: true }); }

  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    const availablePoints = parseInt(args?.[0] ?? '0', 10);

    const atkInput = new TextInputBuilder()
      .setCustomId('sp_atk')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('0')
      .setRequired(false)
      .setMaxLength(5);

    const atkLabel = new LabelBuilder()
      .setLabel('Points into ATK (Damage)')
      .setDescription('Increases your attack damage per point')
      .setTextInputComponent(atkInput);

    const defInput = new TextInputBuilder()
      .setCustomId('sp_def')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('0')
      .setRequired(false)
      .setMaxLength(5);

    const defLabel = new LabelBuilder()
      .setLabel('Points into DEF (Survivability)')
      .setDescription('Increases your damage reduction per point')
      .setTextInputComponent(defInput);

    const infoText = new TextDisplayBuilder()
      .setContent(`-# You have **${availablePoints}** skill points available. This action is permanent.`);

    const modal = new ModalBuilder()
      .setCustomId('skillpoints_modal')
      .setTitle('⭐ Allocate Skill Points')
      .addTextDisplayComponents(infoText)
      .addLabelComponents(atkLabel, defLabel);

    await interaction.showModal(modal);
  }
}