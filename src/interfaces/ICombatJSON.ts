import { IEnemyJSON } from "./IEnemyJSON";
import { IItemJSON } from "./IItemJSON";

export interface ICombatJSON {
  success: boolean;
  combatEnded: boolean;
  victory: boolean;
  flavorText: string;
  playerStats: any;
  enemy: IEnemyJSON | null;
  rewards: {
    xp: number;
    gold: number;
    item: IItemJSON | null;
    levelsGained: number;
  };
  error?: string;
};