require('dotenv').config();
import { Routes, REST } from 'discord.js';
import logger from '../src/utilities/Logger';
const cmdToDelete = '1478498588362277006';

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);

try {
  logger.info(`Attempting to delete the command /${cmdToDelete} ...`);
  rest.delete(Routes.applicationCommand(process.env.APP_ID!, cmdToDelete));
  logger.info('... Successfully deleted the command');
} catch (err) {
  throw err;
}
