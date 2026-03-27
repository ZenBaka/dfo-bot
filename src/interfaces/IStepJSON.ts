import { type IEnemyJSON } from './IEnemyJSON';
import { type IItemJSON } from './IItemJSON';

export interface IStepJSON {
  success: boolean;
  combatTrigger: boolean;
  flavorText: string;
  scenarioAuthor: string;
  scenarioId: string;
  rewards: IStepRewardsJSON;
  playerStats: IStepPlayerStatsJSON;
  error?: string;
  cooldownRemaining?: number;
  enemy?: IEnemyJSON;
  inCombat?: boolean;
}

export interface IStepRewardsJSON {
  xp: number;
  gold: number;
  item: IItemJSON | null;
  levelsGained: number;
  chestDrop: string | null; // Chest tier found while exploring
  toll: number; // Zone toll deducted this step
}

export interface IActiveBonuses {
  critChance: number;
  critDamage: number;
  dodge: number;
  lifeSteal: number;
  goldFind: number;
  xpBonus: number;
  thorns: number;
  cooldownReduction: number;
}

export interface IStepPlayerStatsJSON {
  hp: number;
  maxHp: number;
  level: number;
  exp: number;
  gold: number;
  expRequired: number;
  activeBonuses: IActiveBonuses;
}
