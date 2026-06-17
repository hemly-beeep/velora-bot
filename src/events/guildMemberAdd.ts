import { GuildMember, EmbedBuilder, TextChannel } from 'discord.js';
import GuildModel from '../schemas/Guild';
import InviteModel from '../schemas/Invite';
import GlobalBanModel from '../schemas/GlobalBan';
import { sendServerLog, sendModLog } from '../utils/modlog';
import { E } from '../utils/emojis';
import { Colors } from '../utils/embeds/colors';

export default {
  name: 'guildMemberAdd',
  once: false,
  async execute(member: GuildMember, client: any) {
    const guildData = await GuildModel.findOne({ guildId: member.guild.id });
    if (!guildData) return;

    // Global ban check
    const globalBan = await GlobalBanModel.findOne({ userId: member.user.id });
    if (globalBan) {
      await member.ban({ reason: `Global ban: ${globalBan.reason}` }).catch(() => {});
      return;
    }

    // Anti-raid
    if (guildData.settings?.antiraid?.enabled) {
      const now = Date.now();
      const key = `antiraid_${member.guild.id}`;
      const tracker: number[] = (client._raidTracker = client._raidTracker || new Map()).get(key) || [];
      const filtered = tracker.filter((t: number) => now - t < (guildData.settings.antiraid.joinInterval || 10000));
      filtered.push(now);
      client._raidTracker.set(key, filtered);
      if (filtered.length >= (guildData.settings.antiraid.joinThreshold || 10)) {
        const action = guildData.settings.antiraid.action || 'lockdown';
        if (action === 'kick') await member.kick('Anti-raid triggered').catch(() => {});
        else if (action === 'ban') await member.ban({ reason: 'Anti-raid triggered' }).catch(() => {});
      }
    }

    // New account check
    const accountAge = Date.now() - member.user.createdTimestamp;
    const na = guildData.settings?.automod?.newaccount;
    if (na?.enabled && accountAge < (na.age || 7) * 86400000) {
      const action = na.action || 'kick';
      const reason = 'Account too new';
      if (action === 'kick') await member.kick(reason).catch(() => {});
      else if (action === 'ban') await member.ban({ reason }).catch(() => {});
    }

    // Auto-role
    if (guildData.settings?.autorole?.enabled && guildData.roles?.autoRoles?.length) {
      for (const roleId of guildData.roles.autoRoles) {
        const role = member.guild.roles.cache.get(roleId);
        if (role) await member.roles.add(role).catch(() => {});
      }
    }

    // Welcome message
    const welcome = guildData.settings?.welcome;
    if (welcome?.enabled && guildData.channels?.welcomeChannel) {
      const ch = member.guild.channels.cache.get(guildData.channels.welcomeChannel) as TextChannel;
      if (ch) {
        const memberCount = member.guild.memberCount;
        const msg = (welcome.message || 'Welcome {user} to **{server}**! You are member #{membercount}.')
          .replace('{user}', `${member}`)
          .replace('{server}', member.guild.name)
          .replace('{membercount}', String(memberCount));
        await ch.send({ content: msg }).catch(() => {});
      }
    }

    // Join log
    if (guildData.settings?.logging?.enabled && guildData.settings?.logging?.events?.memberJoin) {
      const embed = new EmbedBuilder().setColor(Colors.SUCCESS)
        .setTitle(`${E.Member} Member Joined`)
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
          { name: `${E.Member} User`, value: `${member.user.tag} (${member.user.id})` },
          { name: `${E.Logs} Account Age`, value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>` },
          { name: `${E.Member} Total Members`, value: `${member.guild.memberCount}` },
        ).setTimestamp();
      await sendServerLog(member.guild, embed, guildData);
    }
  },
};
