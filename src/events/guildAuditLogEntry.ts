import { Guild, AuditLogEvent, GuildAuditLogsEntry } from 'discord.js';
import GuildModel from '../schemas/Guild';

const nukeTracker = new Map<string, Map<string, number[]>>();

export default {
  name: 'guildAuditLogEntryCreate',
  once: false,
  async execute(entry: GuildAuditLogsEntry, guild: Guild, client: any) {
    const guildData = await GuildModel.findOne({ guildId: guild.id });
    if (!guildData?.settings?.antinuke?.enabled) return;

    const an = guildData.settings.antinuke;
    const executorId = (entry.executor as any)?.id;
    if (!executorId) return;

    // Skip whitelisted users and server owner
    if (guild.ownerId === executorId) return;
    if (an.whitelist?.includes(executorId)) return;

    const now = Date.now();
    const guildTracker = nukeTracker.get(guild.id) || new Map<string, number[]>();
    nukeTracker.set(guild.id, guildTracker);

    const trackAction = async (key: string, threshold: number) => {
      const times = (guildTracker.get(key + executorId) || []).filter((t: number) => now - t < 30000);
      times.push(now);
      guildTracker.set(key + executorId, times);
      if (times.length >= threshold) {
        // Trigger anti-nuke action
        const member = guild.members.cache.get(executorId);
        if (!member) return;
        const action = an.action || 'ban';
        try {
          if (action === 'ban') await member.ban({ reason: 'Anti-nuke triggered' });
          else if (action === 'kick') await member.kick('Anti-nuke triggered');
          else if (action === 'strip') await member.roles.set([], 'Anti-nuke triggered');
        } catch {}
        guildTracker.delete(key + executorId);
      }
    };

    if (entry.action === AuditLogEvent.MemberBanAdd) await trackAction('ban', an.thresholds?.banThreshold || 3);
    else if (entry.action === AuditLogEvent.MemberKick) await trackAction('kick', an.thresholds?.kickThreshold || 3);
    else if (entry.action === AuditLogEvent.ChannelDelete) await trackAction('chDel', an.thresholds?.channelDeleteThreshold || 2);
    else if (entry.action === AuditLogEvent.RoleDelete) await trackAction('roleDel', an.thresholds?.roleDeleteThreshold || 2);
  },
};
