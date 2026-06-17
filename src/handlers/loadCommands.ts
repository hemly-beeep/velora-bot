import path from 'path';
import fs from 'fs';
import { Client } from 'discord.js';

export function loadCommands(client: Client) {
  const registry = new Map<string, any>();
  const commandsPath = path.join(__dirname, '../commands');

  function readDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        readDir(fullPath);
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
        try {
          const cmd = require(fullPath).default;
          if (!cmd || !cmd.name) continue;
          registry.set(cmd.name, cmd);
          if (cmd.aliases) {
            for (const alias of cmd.aliases) {
              registry.set(alias, cmd);
            }
          }
        } catch (e) {
          console.error(`Failed to load command at ${fullPath}:`, e);
        }
      }
    }
  }

  readDir(commandsPath);
  (client as any).commandRegistry = registry;
  console.log(`[Commands] Loaded ${[...new Set(registry.values())].length} unique commands (${registry.size} including aliases)`);
  return registry;
}
