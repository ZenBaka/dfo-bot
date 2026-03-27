import { readdirSync } from 'fs';
import Event from '../structures/Event';
import { Client } from 'discord.js';
import { join } from 'path';
const filePath = join(__dirname, '../events');

export default class EventHandler {
  private client: Client;

  constructor(client: Client) {
    this.client = client;

    this.initialize();
  }

  private initialize(): void {
    const eventFiles = readdirSync(filePath).filter(file => (file.endsWith('.ts') || file.endsWith('.js') || !file.endsWith('.d.ts')));

    for (const file of eventFiles) {
      let event = require(join(filePath, file));
      event = new event.default();
      if (!(event instanceof Event)) continue;

      if (event.isOnce) {
        this.client.once(event.name, (...args: any[]) => event.execute(...args, this.client));
      } else {
        this.client.on(event.name, (...args: any[]) => event.execute(...args, this.client));
      }
    }
  }
}