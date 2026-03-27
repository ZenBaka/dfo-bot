import { type IEnemyJSON } from './IEnemyJSON';

export type Privilege =
  | 'Member'
  | 'Donator'
  | 'Moderator'
  | 'Administrator'
  | 'Developer';

export interface IPlayerJSON {
  id: string;
  username: string;
  avatar: string;
  privilege: Privilege;
  level: number;
  experience: number;
  skillPoints: number;
  coins: number;
  currentZone: number;
  isMuted: boolean;
  equipment: {
    Head: string | null;
    Chest: string | null;
    Legs: string | null;
    Hands: string | null;
    Feet: string | null;
    MainHand: string | null;
    OffHand: string | null;
    RingA: string | null;
    RingB: string | null;
    Necklace: string | null;
    Pet: string | null;
    Special: string | null;
  };
  statistics: PlayerStatistics;
  collections: {
    uniqueClaimed: number;
    totalClaimed: number;
  };
  discordRoleData?: {
    accessToken: any;
    refreshToken: any;
    expiresAt: any;
  };
  activeEncounter: IEnemyJSON | null;
  cooldowns: {
    step: Date;
    combat: Date;
  };
  inventory?: any[];
  maxHp?: number;
  lastRegen: Date;
  stats: IPlayerStats;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

export interface IPlayerStats {
  atk: number;
  def: number;
  hp: number;
}

class PlayerStatistics {
  daysPassed: number = 0;
  enemiesDefeated: number = 0;
  playersDefeated: number = 0;
  timesDied: number = 0;
  questsDone: number = 0;
}
