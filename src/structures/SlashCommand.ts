import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import IExecutable from "../interfaces/IExecutable";
import { Client } from "discord.js";

export interface SlashCommandOptions {
  name: string;
  description: string;
  category: string;
  cooldown: number;
  isGlobalCommand: boolean;
}

export default abstract class SlashCommand implements IExecutable {
  private readonly options: SlashCommandOptions;
  protected builder: SlashCommandBuilder;

  constructor(options: SlashCommandOptions) {
    this.options = options;
    this.builder = new SlashCommandBuilder()
      .setName(options.name)
      .setDescription(options.description);
  }

  public get name(): string {
    return this.options.name;
  }

  public get description(): string {
    return this.options.description;
  }

  public get category(): string {
    return this.options.category;
  }

  public get cooldown(): number {
    return this.options.cooldown;
  }

  public get isGlobalCommand(): boolean {
    return this.options.isGlobalCommand;
  }

  public get data(): SlashCommandBuilder {
    return this.builder;
  }

  public abstract execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void>;

  public async autocomplete?(interaction: AutocompleteInteraction, client: Client): Promise<void>;
}