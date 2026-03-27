import { readdirSync } from 'fs';
import Event from '../structures/Event';
import { type Client } from 'discord.js';
import { join } from 'path';
const filePath = join(__dirname, '../events');

export default function initializeEventHandler(client: Client): void {
  const eventFiles = readdirSync(filePath).filter(
    (file) => file.endsWith('.ts') || file.endsWith('.js') || !file.endsWith('.d.ts')
  );

  for (const file of eventFiles) {
    let event = require(join(filePath, file));
    event = new event.default();
    if (!(event instanceof Event)) continue;

    if (event.isOnce) {
      client.once(event.name, (...args: any[]) => event.execute(...args, client)
      );
    } else {
      client.on(event.name, (...args: any[]) => event.execute(...args, client));
    }
  }
}
