// ========== TASKS ==========

export interface ITaskJSON {
  id: string;              // API returns `id`, not `taskId`
  action: string;          // e.g. "EXPLORE_STEPS", "DEFEAT_ENEMIES"
  label: string;           // e.g. "Explore 50 times" (was `description`)
  icon: string;
  target: number;
  progress: number;
  period: 'daily' | 'weekly' | 'monthly';
  reward: {
    gold: number;
    xp: number;
    embers: number;
    chestTier: string | null;
  };
  completed: boolean;
  claimed: boolean;        // API returns `claimed`, not `isClaimed`
  nextReset: string;       // ISO date string
}

export interface ITasksResponse {
  success: boolean;
  tasks: ITaskJSON[];
  embers: number;
  resets: {
    daily: string;         // ISO date strings, not numbers
    weekly: string;
    monthly: string;
  };
  error?: string;
}

// ========== CHESTS ==========

export interface IChestSlot {
  _id: string;
  tier: string;
  emoji: string;
  status: 'locked' | 'unlocking' | 'ready';
  remainingMs: number;
  unlockSeconds: number;
}

export interface IChestDef {
  tier: string;
  emoji: string;
  goldCost: number;
  unlockSeconds: number;
  slot2Chance: number;
  slot3Chance: number;
  rarityWeights: Record<string, number>;
  goldReward: { min: number; max: number };
  emberReward: { min: number; max: number };
}

export interface IChestOpenResult {
  success: boolean;
  message: string;
  loot: {
    items: Array<{ name: string; rarity: string; level: number; type: string }>;
    gold: number;
    embers: number;
    isPity: boolean;
  };
  error?: string;
}
