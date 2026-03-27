import { ButtonInteraction, Client } from "discord.js";
import Button from "../../structures/Button";

export default class RegisterDeclineButton extends Button {
  constructor() { super({ customId: "register_decline", cooldown: 3, isAuthorOnly: true }); }

  public async execute(interaction: ButtonInteraction, client: Client): Promise<void> {
    await interaction.deferUpdate();

    await interaction.editReply({
      content: '👋 **No problem!** No data has been stored. You can run `/register` again anytime if you change your mind.',
      embeds: [],
      components: [],
    });
  }
}