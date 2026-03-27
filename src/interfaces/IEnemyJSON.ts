export interface IEnemyJSON {
  id: string;
  name: string;
  description: string;
  level: number;
  maxHp: number;
  currentHp: number;
  atk: number;
  def: number;
  difficultyRating: number;
  // NPCGenerator fields
  rewardMult: number;
  lootBonus: number;
  prefixIcon: string;
  isPrefixed: boolean;
  isMythic: boolean;
  isChampion: boolean;
  isElite: boolean;
}
