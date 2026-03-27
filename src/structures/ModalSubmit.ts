import type { ModalSubmitInteraction, Client } from 'discord.js';
import type IExecutable from '../interfaces/IExecutable';

export interface ModalSubmitOptions {
  customId: string;
  cooldown: number;
  isAuthorOnly: boolean;
}

export default abstract class ModalSubmit implements IExecutable {
  private readonly options: ModalSubmitOptions;

  constructor(options: ModalSubmitOptions) {
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
    interaction: ModalSubmitInteraction,
    client: Client,
    args?: string[] | null
  ): Promise<void>;
}
