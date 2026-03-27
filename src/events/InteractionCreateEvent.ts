import { BaseInteraction, InteractionReplyOptions, MessageFlags, Client } from "discord.js";
import Event from "../structures/Event";
import SlashCommandHandler from "../handlers/SlashCommandHandler";
import logger from "../utilities/Logger";
import ButtonHandler from "../handlers/ButtonHandler";
import SelectMenuHandler from "../handlers/SelectMenuHandler";
import ModalSubmitHandler from "../handlers/ModalSubmitHandler";
import { formatError } from "../utilities/ErrorMessages";
import { ApiError } from "../utilities/ApiClient";

export default class InteractionCreateEvent extends Event {
  constructor() {
    super({
      name: 'interactionCreate',
      isOnce: false
    });
  }

  private async handleError(interaction: BaseInteraction, err: any) {
    logger.error(err);

    if (interaction.isAutocomplete()) return;
    if (!interaction.isRepliable()) return;

    // Use themed error messages for API errors, fallback for unknown errors
    const message = (err instanceof ApiError)
      ? formatError(err.message, err.code)
      : formatError(err.message || String(err));

    const payload: InteractionReplyOptions = {
      content: message,
      flags: MessageFlags.Ephemeral // All errors are ephemeral (#7)
    };

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch((e) => logger.error(e));
      } else {
        await interaction.reply(payload).catch((e) => logger.error(e));
      }
    } catch (finalErr) {
      logger.error(finalErr);
    }
  }

  public async execute(interaction: BaseInteraction, client: Client): Promise<void> {
    if (interaction.user.bot) return;

    try {
      if (interaction.isChatInputCommand()) {
        await SlashCommandHandler.handle(interaction.commandName, interaction, client);
      } else if (interaction.isButton()) {
        await ButtonHandler.handle(interaction.customId, interaction, client);
      } else if (interaction.isAnySelectMenu()) {
        await SelectMenuHandler.handle(interaction.customId, interaction, client);
      } else if (interaction.isModalSubmit()) {
        await ModalSubmitHandler.handle(interaction.customId, interaction, client);
      } else if (interaction.isAutocomplete()) {
        await SlashCommandHandler.autocomplete(interaction.commandName, interaction, client);
      }
    } catch (err) {
      await this.handleError(interaction, err);
    }
  }
}