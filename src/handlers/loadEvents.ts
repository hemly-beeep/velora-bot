import path from 'path';
import fs from 'fs';
import { Client } from 'discord.js';

export function loadEvents(client: Client) {
  const eventsPath = path.join(__dirname, '../events');
  const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
  for (const file of files) {
    try {
      const event = require(path.join(eventsPath, file));
      const handler = event.default || event;
      if (!handler || !handler.name) continue;
      if (handler.once) {
        client.once(handler.name, (...args) => handler.execute(...args, client));
      } else {
        client.on(handler.name, (...args) => handler.execute(...args, client));
      }
    } catch (e) {
      console.error(`Failed to load event ${file}:`, e);
    }
  }
  console.log(`[Events] Loaded ${files.length} event files`);
}
