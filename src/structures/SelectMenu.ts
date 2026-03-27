import { AnySelectMenuInteraction, Client } from "discord.js";
import IExecutable from "../interfaces/IExecutable";

export interface SelectMenuOptions {
  customId: string;
  cooldown: number;
  isAuthorOnly: boolean;
}

export default abstract class SelectMenu implements IExecutable {
  private readonly options: SelectMenuOptions;

  constructor(options: SelectMenuOptions) {
    this.options = options;
  }

  public get customId(): string {
    return this.options.customId;
  }

  public get cooldown(): number {
    return this.options.cooldown;
  }

  public get isAuthorOnly(): boolean {
    return this.options.isAuthorOnly;
  }

  public abstract execute(interaction: AnySelectMenuInteraction, client: Client, args?: string[] | null): Promise<void>;
}