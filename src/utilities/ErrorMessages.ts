/**
 * Maps raw API error strings and codes to themed, in-character RPG messages.
 * Falls back to the original message if no mapping is found.
 */

const ERROR_MAP: Record<string, string> = {
  // API error codes (structured)
  PLAYER_NOT_FOUND:
    '📜 **Adventurer not found!** Begin your journey with </register:1478150249481633803>.',
  IN_COMBAT:
    "⚔️ **You're already in battle!** Use `/attack` to fight or `/flee` to escape.",
  INCAPACITATED:
    '💀 **You have fallen!** Your wounds are too severe. Rest and recover before venturing out again.',
  NO_ACTIVE_COMBAT:
    '🌿 **No enemy in sight.** Use `/explore` to find your next encounter.',
  API_UNAVAILABLE:
    '🔧 **The realm is under maintenance.** The game server is temporarily unreachable. Please try again in a moment.',
  API_TIMEOUT:
    '⏳ **The winds of fate are slow today.** The game server took too long to respond. Please try again.',
  API_NETWORK_ERROR:
    '🌐 **Lost connection to the realm.** Could not reach the game server. Please try again later.',

  // Raw API error strings (legacy matching)
  'You are incapacitated.':
    '💀 **You have fallen!** Your wounds are too severe. Rest and recover before venturing out again.',
  'You are incapacitated. Wait for regeneration.':
    '💀 **You have fallen!** Wait for your health to regenerate before venturing out.',
  'No active combat found.':
    '🌿 **No enemy in sight.** Use `/explore` to find your next encounter.',
  'You are currently in combat!':
    "⚔️ **You're already in battle!** Use `/attack` to fight or `/flee` to escape.",
  'Player not found':
    '📜 **Adventurer not found!** Begin your journey with `/register`.',
  'Player load failed':
    '📜 **Adventurer not found!** Begin your journey with `/register`.',
  'You need to create player data in order to explore!':
    '📜 **Adventurer not found!** Begin your journey with `/register`.',
  'Item not found':
    "🔍 **That item doesn't exist.** Check the ID and try again.",
  'Not enough items':
    "🎒 **Not enough items!** You don't have that many in your inventory.",
  'Cannot sell a locked item.':
    '🔒 **This item is locked!** Unlock it first before selling.',
  'This item cannot be consumed':
    "❌ **This item can't be consumed.** Only consumable items have effects.",
  'You already have player data!':
    "✅ **You're already registered!** Use `/profile` to see your character."
};

/**
 * Converts a raw API error into a themed message.
 * Checks error code first, then falls back to string matching.
 */
export function formatError(error: string, code?: string): string {
  // Try structured code first
  if (code && ERROR_MAP[code]) return ERROR_MAP[code];

  // Try exact string match
  if (ERROR_MAP[error]) return ERROR_MAP[error];

  // Try partial match for unknown errors
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (error.toLowerCase().includes(key.toLowerCase())) return value;
  }

  // Fallback: wrap the raw error in a themed frame
  return `⚠️ **Something went wrong:** ${error}`;
}

/**
 * Formats a 429 cooldown response with a proper Discord timestamp.
 * @param cooldownRemainingMs - milliseconds remaining (from API), or null for a generic message
 */
export function formatCooldown(
  action: 'step' | 'combat',
  cooldownRemainingMs?: number
): string {
  if (cooldownRemainingMs) {
    const futureTimestamp =
      Math.floor(Date.now() / 1000) + Math.ceil(cooldownRemainingMs / 1000);
    if (action === 'step') {
      return `⏳ **Recovering...** You can explore again <t:${futureTimestamp}:R>.`;
    }
    return `⏳ **Weapon cooling down!** You can attack again <t:${futureTimestamp}:R>.`;
  }

  if (action === 'step')
    return '⏳ **Recovering...** Please wait before exploring again.';
  return '⏳ **Weapon cooling down!** Please wait before attacking again.';
}
