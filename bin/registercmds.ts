import { Routes, REST } from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';
import SlashCommand from '../src/structures/SlashCommand';
import logger from '../src/utilities/Logger';
require('dotenv').config();
const commandDirectory = './src/commands/';

const commandArray = [];
const globalCommandArray = [];

const commandFiles = readdirSync(commandDirectory);
for (const file of commandFiles) {
  const fullPath = path.resolve(commandDirectory, file);
  const command = require(fullPath);
  const Module = new command.default();
  if (!(Module instanceof SlashCommand)) continue;
  if (Module.isGlobalCommand) {
    globalCommandArray.push(Module.data.toJSON());
  } else {
    commandArray.push(Module.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);

try {
  logger.info(
    `Attempting to register ${commandArray.length} server commands...`
  );
  rest.put(
    Routes.applicationGuildCommands(process.env.APP_ID!, process.env.GUILD_ID!),
    { body: commandArray }
  );
  logger.info('Successfully registered commands!');
} catch (err) {
  throw err;
}

try {
  logger.info(
    `Attempting to register ${globalCommandArray.length} global commands...`
  );
  rest.put(Routes.applicationCommands(process.env.APP_ID!), {
    body: globalCommandArray
  });
  logger.info('Successfully registered commands!');
} catch (err) {
  throw err;
}
