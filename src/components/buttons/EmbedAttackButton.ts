import { ButtonInteraction, Client } from "discord.js";
import Button from "../../structures/Button";
import { ICombatJSON } from "../../interfaces/ICombatJSON";
import { apiFetch } from "../../utilities/ApiClient";
import { buildCombatResponse } from "../../utilities/CombatResponseBuilder";
import { formatError, formatCooldown } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";

export default class EmbedAttackButton extends Button {
  constructor() { super({ customId: "embedAttack", cooldown: 1.8, isAuthorOnly: true }); }

  public async execute(interaction: ButtonInteraction, client: Client): Promise<void> {
    await interaction.deferUpdate();

    const res = await apiFetch(Routes.combat(), {
      method: 'POST',
      body: JSON.stringify({ discordId: interaction.user.id, action: 'attack' })
    });

    if (res.status === 429) {
      await interaction.editReply({ content: formatCooldown('combat') });
      return;
    }

    const data = await res.json() as ICombatJSON;

    if (data.error) {
      await interaction.editReply({ content: formatError(data.error) });
      return;
    }

    const response = await buildCombatResponse(data);
    await interaction.editReply(response);
  }
}