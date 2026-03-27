export interface ICollectionJSON {
  userId: string;
  items: Map<string, number>;
  totalItemsCollected: number;
  uniqueItemsFound: number;
  createdAt: Date;
  updatedAt: Date;
}
