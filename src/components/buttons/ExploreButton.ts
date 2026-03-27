import { ButtonInteraction, Client, MessageFlags } from "discord.js";
import Button from "../../structures/Button";
import { IStepJSON } from "../../interfaces/IStepJSON";
import { apiFetch } from "../../utilities/ApiClient";
import { buildCombatResponse } from "../../utilities/CombatResponseBuilder";
import { formatError, formatCooldown } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";

export default class ExploreButton extends Button {
  constructor() { super({ customId: "explore", cooldown: 7, isAuthorOnly: false }); }

  public async execute(interaction: ButtonInteraction, client: Client): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const res = await apiFetch(Routes.explore(), {
      method: 'POST',
      body: JSON.stringify({ discordId: interaction.user.id }),
    });

    const data = await res.json() as IStepJSON;

    if (res.status === 429) {
      await interaction.editReply({ content: formatCooldown('step', data.cooldownRemaining) });
      return;
    }

    if (res.status === 404) {
      await interaction.editReply({ content: formatError('', 'PLAYER_NOT_FOUND') });
      return;
    }

    if (data.error) {
      await interaction.editReply({ content: formatError(data.error) });
      return;
    }

    const response = await buildCombatResponse(data);
    await interaction.editReply(response);
  }
}