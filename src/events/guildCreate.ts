import { Guild } from 'discord.js';
import GuildModel from '../schemas/Guild';

export default {
  name: 'guildCreate',
  once: false,
  async execute(guild: Guild) {
    try {
      await GuildModel.findOneAndUpdate(
        { guildId: guild.id },
        { $setOnInsert: { guildId: guild.id, prefix: '??', caseCounter: 0 } },
        { upsert: true }
      );
      console.log(`[Guild] Joined: ${guild.name} (${guild.id}) — ${guild.memberCount} members`);
    } catch (e) {
      console.error(`[Guild] Error creating guild doc for ${guild.id}:`, e);
    }
  },
};
