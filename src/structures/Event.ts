import type IExecutable from '../interfaces/IExecutable';

export interface EventOptions {
  name: string;
  isOnce: boolean;
}

export default abstract class Event implements IExecutable {
  private readonly options: EventOptions;

  constructor(options: EventOptions) {
    this.options = options;
  }

  public get name(): string {
    return this.options.name;
  }

  public get isOnce(): boolean {
    return this.options.isOnce;
  }

  public abstract execute(...args: any[]): Promise<void>;
}
