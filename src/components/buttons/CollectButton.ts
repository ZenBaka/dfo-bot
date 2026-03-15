import { ButtonInteraction, Client, ModalBuilder, TextInputStyle } from "discord.js";
import Button from "../../structures/Button";

export default class CollectButton extends Button {
  constructor() {
    super('collect');
  }

  // customId format: collect:<docId>:<maxQuantity>
  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    const docId = args?.[0];
    const maxQty = args?.[1] ?? '1';

    const modal = new ModalBuilder()
      .setCustomId(`collect:${docId}`)
      .setTitle('⚠️ Collect Item (Permanent)')
      .addLabelComponents(
        (label) =>
          label.setLabel('Amount').setDescription(`⚠️ This is PERMANENT and cannot be undone. Items are removed from inventory and added to your Collection Book. (Max: ${maxQty})`)
          .setTextInputComponent((ti) => ti.setCustomId('ti1').setRequired(true).setStyle(TextInputStyle.Short).setPlaceholder(maxQty))
      );

    await interaction.showModal(modal);
  }

  public isAuthorOnly(): boolean { return true; }
  public cooldown(): number { return 2; }
}
