import { ButtonInteraction, Client, Colors, ContainerBuilder, MessageFlags } from "discord.js";
import Button from "../../structures/Button";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";

export default class RegisterAcceptButton extends Button {
  constructor() { super({ customId: "register_accept", cooldown: 5, isAuthorOnly: true }); }

  public async execute(interaction: ButtonInteraction, client: Client): Promise<void> {
    await interaction.deferUpdate();

    const discordId = interaction.user.id;
    const username = interaction.user.username;
    const avatar = interaction.user.avatar;

    try {
      const res = await apiFetch(Routes.registerPlayer(), {
        method: 'POST',
        body: JSON.stringify({ discordId, username, avatar }),
      });

      if (res.status === 409) {
        await interaction.editReply({
          content: '✅ **You\'re already registered!** Use `/profile` to see your character.',
          embeds: [],
          components: [],
        });
        return;
      }

      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({
          content: formatError(body.error ?? 'Registration failed.'),
          embeds: [],
          components: [],
        });
        return;
      }

      const container = new ContainerBuilder().setAccentColor(Colors.Green);

      container.addTextDisplayComponents(
        (textDisplay) =>
          textDisplay.setContent('## ⚔️ Character Created!'),
        (textDisplay) =>
          textDisplay.setContent(`Welcome to Dragon's Fall Online, **${username}**! Your adventure begins now.`),
        (textDisplay) =>
          textDisplay.setContent(
            '**Get started:**\n' +
            '> `/explore` — Venture into the world\n' +
            '> `/profile` — View your character\n' +
            '> `/help` — See all commands'
          ),
      );

      container.addSeparatorComponents((s) => s);

      container.addTextDisplayComponents(
        (textDisplay) =>
          textDisplay.setContent('-# ⚔️ DFO Cross-Platform Integration • To request data deletion, contact the developer')
      );

      await interaction.editReply({
        embeds: [],
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (err: any) {
      await interaction.editReply({
        content: formatError(err.message, err.code),
        embeds: [],
        components: [],
      });
    }
  }
}