export interface IInventoryItem {
  _id: string; // MongoDB document ID — used for variant targeting
  userId: string;
  itemId: number;
  quantity: number;
  isLocked: boolean;
  enhanceLevel: number; // 0 = base, 1-10 = enhanced
  statOverrides: { atk: number; def: number; hp: number } | null;
  affixOverrides: { type: string; value: number }[] | null;
  petLevel: number;
  createdAt: Date;
  updatedAt: Date;
}
