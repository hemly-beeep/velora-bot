import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import path from 'path';
import fs from 'fs';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('[Deploy] DISCORD_TOKEN and CLIENT_ID are required');
  process.exit(1);
}

const commands: any[] = [];
const commandsPath = path.join(__dirname, 'commands');

function readDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      readDir(fullPath);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
      try {
        const cmd = require(fullPath).default;
        if (cmd?.slashData) {
          commands.push(cmd.slashData.toJSON());
        }
      } catch (e) {
        console.error(`[Deploy] Failed to load ${fullPath}:`, e);
      }
    }
  }
}

readDir(commandsPath);

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log(`[Deploy] Registering ${commands.length} slash commands globally...`);
    const data = await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands }) as any[];
    console.log(`[Deploy] Successfully registered ${data.length} slash commands`);
  } catch (e) {
    console.error('[Deploy] Error:', e);
    process.exit(1);
  }
})();
