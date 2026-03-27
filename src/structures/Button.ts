import type IExecutable from '../interfaces/IExecutable';
import type { ButtonInteraction, Client } from 'discord.js';

export interface ButtonOptions {
  customId: string;
  cooldown: number;
  isAuthorOnly: boolean;
}

export default abstract class Button implements IExecutable {
  private readonly options: ButtonOptions;

  constructor(options: ButtonOptions) {
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

  public abstract execute(
    interaction: ButtonInteraction,
    client: Client,
    args?: string[] | null
  ): Promise<void>;
}
