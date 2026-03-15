import { ButtonInteraction, Client, ModalBuilder, TextInputStyle } from "discord.js";
import Button from "../../structures/Button";

export default class ConsumeButton extends Button {
  constructor() {
    super('consume');
  }

  // customId format: consume:<docId>:<maxQuantity>
  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    const docId = args?.[0];
    const maxQty = args?.[1] ?? '1';

    const modal = new ModalBuilder()
      .setTitle('Consume Item')
      .setCustomId(`consume:${docId}`)
      .addLabelComponents(
        (label) =>
          label.setLabel('Amount').setDescription(`Enter amount to consume (Max: ${maxQty})`)
          .setTextInputComponent((ti) => ti.setCustomId('ti1').setRequired(true).setStyle(TextInputStyle.Short))
      );

    await interaction.showModal(modal);
  }

  public isAuthorOnly(): boolean { return true; }
  public cooldown(): number { return 2; }
}
