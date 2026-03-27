export function HEADERS(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.BOT_TOKEN}`,
    'Content-Type': 'application/json'
  };
}

// ========== PLAYER ==========

export function player(userId: string): string {
  return `https://capi.gg/api/bot/player/${userId}`;
}

export function registerPlayer(): string {
  return 'https://capi.gg/api/bot/player/register';
}

// ========== INVENTORY ==========

export function inventory(userId: string): string {
  return `https://capi.gg/api/bot/player/inventory/${userId}/all`;
}

export function inventoryItem(userId: string, itemId: number): string {
  return `https://capi.gg/api/bot/player/inventory/${userId}/${itemId}`;
}

// ========== ITEMS ==========

export function item(itemId: number): string {
  return `https://capi.gg/api/bot/items/${itemId}`;
}

export function items(): string {
  return 'https://capi.gg/api/bot/items/all';
}

// ========== SCENARIOS ==========

export function scenario(scenarioId: number): string {
  return `https://capi.gg/api/bot/scenarios/${scenarioId}`;
}

export function scenarios(): string {
  return 'https://capi.gg/api/bot/scenarios/all';
}

// ========== NPCS ==========

export function npc(npcId: number): string {
  return `https://capi.gg/api/bot/npcs/${npcId}`;
}

export function npcs(): string {
  return `https://capi.gg/api/bot/npcs/all`;
}

// ========== INVENTORY ACTIONS ==========

export function equip(): string {
  return 'https://capi.gg/api/inventory/equip';
}

export function unequip(): string {
  return 'https://capi.gg/api/inventory/unequip';
}

export function lock(): string {
  return 'https://capi.gg/api/inventory/lock';
}

export function consume(): string {
  return 'https://capi.gg/api/inventory/consume';
}

export function sell(): string {
  return 'https://capi.gg/api/inventory/sell';
}

export function enhance(): string {
  return 'https://capi.gg/api/inventory/enhance';
}

export function reforge(): string {
  return 'https://capi.gg/api/inventory/reforge';
}

export function dismantle(): string {
  return 'https://capi.gg/api/inventory/dismantle';
}

export function collectionAdd(): string {
  return 'https://capi.gg/api/collection/add';
}

// ========== ADVENTURE ==========

export function explore(): string {
  return 'https://capi.gg/api/adventure/step';
}

export function combat(): string {
  return 'https://capi.gg/api/adventure/combat';
}

export function rest(): string {
  return 'https://capi.gg/api/adventure/rest';
}

export function travel(): string {
  return 'https://capi.gg/api/adventure/travel';
}

// ========== TASKS ==========

export function tasks(): string {
  return 'https://capi.gg/api/tasks';
}

// ========== CHESTS ==========

export function chests(): string {
  return 'https://capi.gg/api/chests';
}

// ========== LEADERBOARD ==========

export function leaderboard(stat: string): string {
  return `https://capi.gg/api/bot/leaderboard?stat=${stat}`;
}

// ========== TELEMETRY ==========

export function telemetry(): string {
  return 'https://capi.gg/api/telemetry/db-stats';
}

// ========== MARKET ==========

export function marketBrowse(
  discordId: string,
  params?: {
    page?: number;
    search?: string;
    rarity?: string;
    type?: string;
    sort?: string;
  }
): string {
  const base = `https://capi.gg/api/market?discordId=${discordId}&limit=8`;
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.search) qs.set('search', params.search);
  if (params?.rarity && params.rarity !== 'All')
    qs.set('rarity', params.rarity);
  if (params?.type && params.type !== 'All') qs.set('type', params.type);
  if (params?.sort) qs.set('sort', params.sort);
  const extra = qs.toString();
  return extra ? `${base}&${extra}` : base;
}

export function marketMyListings(discordId: string, page: number = 1): string {
  return `https://capi.gg/api/market?sellerId=${discordId}&discordId=${discordId}&limit=8&page=${page}`;
}

export function marketBuy(): string {
  return 'https://capi.gg/api/market/buy';
}

export function marketList(): string {
  return 'https://capi.gg/api/market/list';
}

export function marketCancel(): string {
  return 'https://capi.gg/api/market/cancel';
}

export function marketTrend(itemId: number): string {
  return `https://capi.gg/api/market/trend?itemId=${itemId}`;
}

// ========== PROFILE ==========

export function allocate(): string {
  return 'https://capi.gg/api/profile/allocate';
}

// ========== BULK OPERATIONS ==========

export function bulkSell(): string {
  return 'https://capi.gg/api/inventory/bulk-sell';
}

export function bulkCollect(): string {
  return 'https://capi.gg/api/collection/bulk-add';
}

export function bulkDismantle(): string {
  return 'https://capi.gg/api/inventory/bulk-dismantle';
}
