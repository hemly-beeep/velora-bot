import { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import GuildModel from '../../schemas/Guild';

export default {
  name: 'autosetup',
  aliases: ['setup', 'quicksetup'],
  category: 'Settings',
  description: 'Automatically create all roles, channels, and configure the bot in one command.',
  usageSlash: '/autosetup',
  usagePrefix: '??autosetup',
  examples: ['??autosetup', '/autosetup'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 30,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('autosetup')
    .setDescription('Auto-create roles, channels, and configure Velora in one command.'),

  async execute(ctx: any) {
    await ctx.defer();
    const guild = ctx.guild;
    const me = guild.members.me;

    if (!me.permissions.has(PermissionFlagsBits.ManageChannels) || !me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return ctx.reply({ content: `${E.Cross} I need **Manage Channels** and **Manage Roles** permissions to run autosetup.`, ephemeral: true });
    }

    const status: string[] = [];
    const channelIds: Record<string, string> = {};
    const roleIds: Record<string, string> = {};

    const safeCreate = async (label: string, fn: () => Promise<string>) => {
      try {
        const result = await fn();
        status.push(`${E.Tick} ${label}`);
        return result;
      } catch {
        status.push(`${E.Cross} ${label} (skipped)`);
        return '';
      }
    };

    // ── Roles ──────────────────────────────────────────────
    const existing = {
      mod:    guild.roles.cache.find((r: any) => r.name === 'Moderator'),
      admin:  guild.roles.cache.find((r: any) => r.name === 'Administrator'),
      muted:  guild.roles.cache.find((r: any) => r.name === 'Muted'),
      verified: guild.roles.cache.find((r: any) => r.name === 'Verified'),
    };

    roleIds.modRole = await safeCreate('Moderator role', async () => {
      if (existing.mod) { return existing.mod.id; }
      const r = await guild.roles.create({ name: 'Moderator', color: '#3498DB', reason: 'Velora autosetup', permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers, PermissionFlagsBits.MuteMembers] });
      return r.id;
    });

    roleIds.adminRole = await safeCreate('Administrator role', async () => {
      if (existing.admin) { return existing.admin.id; }
      const r = await guild.roles.create({ name: 'Administrator', color: '#E74C3C', reason: 'Velora autosetup', permissions: [PermissionFlagsBits.Administrator] });
      return r.id;
    });

    roleIds.muteRole = await safeCreate('Muted role', async () => {
      if (existing.muted) { return existing.muted.id; }
      const r = await guild.roles.create({ name: 'Muted', color: '#95A5A6', reason: 'Velora autosetup' });
      // Deny send messages in all text channels
      for (const [, ch] of guild.channels.cache) {
        if ((ch as any).type === 0 || (ch as any).type === 2) {
          await (ch as any).permissionOverwrites.create(r.id, { SendMessages: false, Speak: false }).catch(() => {});
        }
      }
      return r.id;
    });

    roleIds.verifiedRole = await safeCreate('Verified role', async () => {
      if (existing.verified) { return existing.verified.id; }
      const r = await guild.roles.create({ name: 'Verified', color: '#2ECC71', reason: 'Velora autosetup' });
      return r.id;
    });

    // ── Log Category & Channels ─────────────────────────────
    const logsCategory = await safeCreate('Velora Logs category', async () => {
      const cat = await guild.channels.create({ name: 'Velora Logs', type: ChannelType.GuildCategory, permissionOverwrites: [{ id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] }], reason: 'Velora autosetup' });
      return cat.id;
    });
    const logsCategoryId = logsCategory || undefined;

    channelIds.modLogs = await safeCreate('#mod-logs channel', async () => {
      const ch = await guild.channels.create({ name: 'mod-logs', type: ChannelType.GuildText, parent: logsCategoryId, reason: 'Velora autosetup' });
      return ch.id;
    });

    channelIds.serverLogs = await safeCreate('#server-logs channel', async () => {
      const ch = await guild.channels.create({ name: 'server-logs', type: ChannelType.GuildText, parent: logsCategoryId, reason: 'Velora autosetup' });
      return ch.id;
    });

    channelIds.joinLogs = await safeCreate('#join-logs channel', async () => {
      const ch = await guild.channels.create({ name: 'join-logs', type: ChannelType.GuildText, parent: logsCategoryId, reason: 'Velora autosetup' });
      return ch.id;
    });

    // ── Welcome / Goodbye ───────────────────────────────────
    const generalCategory = guild.channels.cache.find((c: any) => c.type === 4 && (c.name.toLowerCase().includes('general') || c.name.toLowerCase().includes('main')));
    const generalParent = generalCategory?.id;

    channelIds.welcomeChannel = await safeCreate('#welcome channel', async () => {
      const ch = await guild.channels.create({ name: 'welcome', type: ChannelType.GuildText, parent: generalParent, reason: 'Velora autosetup' });
      return ch.id;
    });

    channelIds.goodbyeChannel = await safeCreate('#goodbye channel', async () => {
      const ch = await guild.channels.create({ name: 'goodbye', type: ChannelType.GuildText, parent: generalParent, reason: 'Velora autosetup' });
      return ch.id;
    });

    // ── Ticket Category ─────────────────────────────────────
    channelIds.ticketCategory = await safeCreate('Support Tickets category', async () => {
      const cat = await guild.channels.create({ name: 'Support Tickets', type: ChannelType.GuildCategory, reason: 'Velora autosetup' });
      return cat.id;
    });

    // ── Save to Database ────────────────────────────────────
    const modRolesList = [roleIds.modRole, roleIds.adminRole].filter(Boolean);
    const adminRolesList = [roleIds.adminRole].filter(Boolean);

    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      {
        $set: {
          setupComplete: true,
          ...(channelIds.modLogs    && { 'channels.modLogs': channelIds.modLogs }),
          ...(channelIds.serverLogs && { 'channels.serverLogs': channelIds.serverLogs }),
          ...(channelIds.joinLogs   && { 'channels.joinLogs': channelIds.joinLogs }),
          ...(channelIds.welcomeChannel  && { 'channels.welcomeChannel': channelIds.welcomeChannel }),
          ...(channelIds.goodbyeChannel  && { 'channels.goodbyeChannel': channelIds.goodbyeChannel }),
          ...(channelIds.ticketCategory  && { 'channels.ticketCategory': channelIds.ticketCategory }),
          ...(roleIds.muteRole    && { 'roles.muteRole': roleIds.muteRole }),
          ...(roleIds.verifiedRole && { 'roles.verifiedRole': roleIds.verifiedRole }),
          'settings.logging.enabled': true,
          'settings.welcome.enabled': true,
          'settings.goodbye.enabled': true,
          'settings.welcome.useBanner': true,
          'settings.welcome.message': 'Welcome to **{guild}**, {user}! You are member #{count}.',
          'settings.goodbye.message': '**{user}** has left **{guild}**.',
        },
        ...(modRolesList.length   && { $addToSet: { 'roles.modRoles': { $each: modRolesList } } }),
        ...(adminRolesList.length && { $addToSet: { 'roles.adminRoles': { $each: adminRolesList } } }),
      },
      { upsert: true }
    );

    // ── Summary Embed ───────────────────────────────────────
    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle(`${E.Settings} Velora Auto-Setup Complete`)
      .setDescription(`**${guild.name}** has been fully configured!\n\n**Setup Results:**\n${status.join('\n')}`)
      .addFields(
        {
          name: `${E.Role} Roles Created`,
          value: [
            roleIds.modRole    && `Moderator: <@&${roleIds.modRole}>`,
            roleIds.adminRole  && `Admin: <@&${roleIds.adminRole}>`,
            roleIds.muteRole   && `Muted: <@&${roleIds.muteRole}>`,
            roleIds.verifiedRole && `Verified: <@&${roleIds.verifiedRole}>`,
          ].filter(Boolean).join('\n') || 'None created',
          inline: true,
        },
        {
          name: `${E.Channel} Channels Created`,
          value: [
            channelIds.modLogs       && `Mod Logs: <#${channelIds.modLogs}>`,
            channelIds.serverLogs    && `Server Logs: <#${channelIds.serverLogs}>`,
            channelIds.joinLogs      && `Join Logs: <#${channelIds.joinLogs}>`,
            channelIds.welcomeChannel && `Welcome: <#${channelIds.welcomeChannel}>`,
            channelIds.goodbyeChannel && `Goodbye: <#${channelIds.goodbyeChannel}>`,
          ].filter(Boolean).join('\n') || 'None created',
          inline: true,
        },
        {
          name: `${E.Tick} Next Steps`,
          value: [
            '• Use `/setprefix` to change the command prefix',
            '• Use `/setrole` to add more mod/admin roles',
            '• Use `/setlogs` to fine-tune log channels',
            '• Use `/verification` to set up user verification',
            '• Use `/ticket setup` to configure tickets',
            '• Use `/automod` to enable auto-moderation',
            '• Use `/antiraid` and `/antinuke` for protection',
          ].join('\n'),
        }
      )
      .setFooter({ text: 'All settings saved. Run ??settings to view configuration.' });

    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};
