import {
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  MessageFlags
} from 'discord.js';
import * as Routes from './Routes';
import { apiFetch } from './ApiClient';

/**
 * Checks if a player is registered before allowing a gameplay command to proceed.
 * Returns the API response data if registered, or null if not (after sending an error reply).
 *
 * Usage:
 *   const playerData = await PlayerGuard.check(interaction);
 *   if (!playerData) return; // Guard already replied with a helpful message
 */

/**
 * Verify a player exists via the API. If not, reply with a themed onboarding message.
 * Designed for commands that call deferReply() first.
 */
export async function check(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  discordId?: string
): Promise<any | null> {
  const id = discordId ?? interaction.user.id;

  try {
    const res = await apiFetch(Routes.player(id));

    if (res.status === 404) {
      const content =
        '📜 **Adventurer not found!**\nYou need to register before you can play. Use the `/register` command to begin your journey!';

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
      }
      return null;
    }

    if (!res.ok) return null;

    const body = await res.json();
    return body.data ?? body;
  } catch {
    return null;
  }
}
