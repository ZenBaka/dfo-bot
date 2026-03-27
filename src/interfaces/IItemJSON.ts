export type ItemType =
  | 'Weapon'
  | 'Armor'
  | 'Accessory'
  | 'Consumable'
  | 'Material'
  | 'Collectible';
export type EffectType = 'HEAL_HP' | 'GRANT_XP' | 'GRANT_GOLD' | 'NONE';
export type Rarity =
  | 'Common'
  | 'Uncommon'
  | 'Rare'
  | 'Elite'
  | 'Epic'
  | 'Legendary'
  | 'Divine'
  | 'Exotic';

export const RARITY_COLORS: Record<string, number> = {
  Common: 0xb0b0b0,
  Uncommon: 0x2ecc71,
  Rare: 0x3498db,
  Elite: 0xe67e22,
  Epic: 0x9b59b6,
  Legendary: 0xf1c40f,
  Divine: 0x00e5ff,
  Exotic: 0xff00cc
};

export type EquipmentSlot =
  | 'Head'
  | 'Chest'
  | 'Legs'
  | 'Hands'
  | 'Feet'
  | 'MainHand'
  | 'OffHand'
  | 'RingA'
  | 'RingB'
  | 'Necklace'
  | 'Pet'
  | 'Special'
  | 'None';

export type ItemAffixes =
  | 'LIFE_STEAL'
  | 'CRIT_CHANCE'
  | 'CRIT_DMG'
  | 'DODGE'
  | 'GOLD_FIND'
  | 'XP_BONUS'
  | 'THORNS';

export interface IItemJSON {
  itemId: number;
  name: string;
  description: string;
  rarity: Rarity;
  type: ItemType;
  slot: EquipmentSlot;
  level: number;
  stats: {
    atk: number;
    def: number;
    hp: number;
  };
  affixes?: { type: ItemAffixes; value: number }[];
  action: {
    effect: EffectType;
    amount: number;
    cooldown?: number;
  };
  value: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
