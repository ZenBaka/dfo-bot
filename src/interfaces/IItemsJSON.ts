import { type IItemJSON } from './IItemJSON';

export interface IItemsJSON {
  success: boolean;
  count: number;
  data: IItemJSON[];
}
