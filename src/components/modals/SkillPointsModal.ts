import { ModalSubmitInteraction, Client, MessageFlags } from "discord.js";
import ModalSubmit from "../../structures/ModalSubmit";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";

export default class SkillPointsModal extends ModalSubmit {
  constructor() { super({ customId: "skillpoints_modal", cooldown: 5, isAuthorOnly: true }); }

  public async execute(interaction: ModalSubmitInteraction, client: Client): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const atkRaw = interaction.fields.getTextInputValue('sp_atk').trim();
    const defRaw = interaction.fields.getTextInputValue('sp_def').trim();

    const atkAmount = parseInt(atkRaw, 10) || 0;
    const defAmount = parseInt(defRaw, 10) || 0;

    if (atkAmount < 0 || defAmount < 0) {
      await interaction.editReply({ content: '❌ Point values cannot be negative.' });
      return;
    }

    if (atkAmount === 0 && defAmount === 0) {
      await interaction.editReply({ content: '❌ You didn\'t allocate any points. Enter a number in at least one field.' });
      return;
    }

    const discordId = interaction.user.id;
    const results: string[] = [];

    try {
      // Allocate ATK
      if (atkAmount > 0) {
        const res = await apiFetch(Routes.allocate(), {
          method: 'POST',
          body: JSON.stringify({ discordId, stat: 'atk', amount: atkAmount }),
        });
        const body = await res.json();

        if (!res.ok || !body.success) {
          await interaction.editReply({ content: formatError(body.error ?? 'Failed to allocate ATK points') });
          return;
        }
        results.push(`⚔️ **+${atkAmount} ATK** → Now: ${body.newStats.atk}`);
      }

      // Allocate DEF
      if (defAmount > 0) {
        const res = await apiFetch(Routes.allocate(), {
          method: 'POST',
          body: JSON.stringify({ discordId, stat: 'def', amount: defAmount }),
        });
        const body = await res.json();

        if (!res.ok || !body.success) {
          await interaction.editReply({ content: formatError(body.error ?? 'Failed to allocate DEF points') });
          return;
        }
        results.push(`🛡️ **+${defAmount} DEF** → Now: ${body.newStats.def}`);
      }

      await interaction.editReply({
        content: `⭐ **Skill Points Allocated!**\n\n${results.join('\n')}\n\nRun \`/profile\` to see your updated stats.`
      });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code) });
    }
  }
}