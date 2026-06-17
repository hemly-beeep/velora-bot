import { ButtonInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { createCase, sendModLog, sendPublicLog } from '../../utils/modlog';
import GuildModel from '../../schemas/Guild';
import WarnModel from '../../schemas/Warn';
import WarnPunishModel from '../../schemas/WarnPunish';
import NoteModel from '../../schemas/Note';
import CaseModel from '../../schemas/Case';
import TempRoleModel from '../../schemas/TempRole';
import GlobalBanModel from '../../schemas/GlobalBan';
import { parseDuration, formatDuration } from '../../utils/duration';

function getUserId(customId: string): string {
  return customId.split('_').at(-1) || '';
}

function checkUser(i: ButtonInteraction, customId: string): boolean {
  const id = getUserId(customId);
  if (!id || id === 'PUBLIC') return true;
  if (i.user.id !== id) {
    i.reply({ content: `${E.Cross} This button is not for you.`, ephemeral: true }).catch(() => {});
    return false;
  }
  return true;
}

export async function handleButton(i: ButtonInteraction, client: any) {
  const id = i.customId;

  // Close button
  if (id.startsWith('velora_close_')) {
    if (!checkUser(i, id)) return;
    await i.message.delete().catch(() => {});
    return;
  }

  // ==================== BAN ====================
  if (id.startsWith('velora_ban_type_')) {
    if (!checkUser(i, id)) return;
    const selectedValue = (i as any).values?.[0];
    if (!selectedValue) return i.reply({ content: `${E.Cross} No option selected.`, ephemeral: true });
    const [banType, userId, encodedReason] = selectedValue.split('_');
    const reason = decodeURIComponent(encodedReason || '');
    const guildData = await GuildModel.findOne({ guildId: i.guild!.id });

    if (banType === 'perm') {
      await i.deferUpdate();
      const target = await client.users.fetch(userId).catch(() => null);
      try {
        await i.guild!.members.ban(userId, { reason, deleteMessageSeconds: 0 });
        const caseDoc = await createCase({ guildId: i.guild!.id, type: 'BAN', userId, userTag: target?.tag, moderatorId: i.user.id, moderatorTag: i.user.tag, reason });
        const logEmbed = new EmbedBuilder().setColor(Colors.BAN).setTitle(`${E.BanHammer} Member Banned`)
          .addFields({ name: `${E.Member} User`, value: `${target?.tag || userId}` }, { name: `${E.Crown} Moderator`, value: i.user.tag }, { name: `${E.Reason} Reason`, value: reason }, { name: `${E.Logs} Case`, value: `#${caseDoc.caseId}` });
        await sendModLog(i.guild!, logEmbed, guildData);
        const success = new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} ${target?.tag || userId} has been banned`).addFields({ name: `${E.Reason} Reason`, value: reason }, { name: `${E.Logs} Case`, value: `#${caseDoc.caseId}` });
        await i.editReply({ embeds: [success], components: [] });
      } catch (e: any) {
        await i.editReply({ content: `${E.Cross} Failed to ban: ${e.message}`, embeds: [], components: [] });
      }
    } else {
      // Temp ban — update message to ask for duration
      const embed = new EmbedBuilder().setColor(Colors.BAN).setTitle(`${E.BanHammer} Temp Ban — Select Duration`).setDescription('Select a duration for the temporary ban.');
      const { StringSelectMenuBuilder, ActionRowBuilder } = await import('discord.js');
      const { withClose } = await import('../../utils/embeds/builders');
      const durSelect = new StringSelectMenuBuilder().setCustomId(`velora_tempban_duration_${userId}_${encodedReason}_${i.user.id}`).setPlaceholder('Select duration...').addOptions(
        { label: '1 Hour', value: '3600000' }, { label: '6 Hours', value: '21600000' },
        { label: '1 Day', value: '86400000' }, { label: '3 Days', value: '259200000' },
        { label: '1 Week', value: '604800000' }, { label: '30 Days', value: '2592000000' },
      );
      const rows = withClose([new ActionRowBuilder<any>().addComponents(durSelect)], i.user.id);
      await i.update({ embeds: [embed], components: rows });
    }
    return;
  }

  // ==================== UNBAN ====================
  if (id.startsWith('velora_unban_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const userId = parts[3];
    const reason = decodeURIComponent(parts[4] || '');
    await i.deferUpdate();
    try {
      await i.guild!.members.unban(userId, reason);
      const target = await client.users.fetch(userId).catch(() => null);
      const guildData = await GuildModel.findOne({ guildId: i.guild!.id });
      const caseDoc = await createCase({ guildId: i.guild!.id, type: 'UNBAN', userId, userTag: target?.tag, moderatorId: i.user.id, moderatorTag: i.user.tag, reason });
      const logEmbed = new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Unban} Member Unbanned`).addFields({ name: `${E.Member} User`, value: target?.tag || userId }, { name: `${E.Crown} Moderator`, value: i.user.tag }, { name: `${E.Reason} Reason`, value: reason });
      await sendModLog(i.guild!, logEmbed, guildData);
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} ${target?.tag || userId} has been unbanned`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed to unban: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== KICK ====================
  if (id.startsWith('velora_kick_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const userId = parts[3];
    const reason = decodeURIComponent(parts[4] || '');
    await i.deferUpdate();
    try {
      const member = await i.guild!.members.fetch(userId);
      await member.kick(reason);
      const guildData = await GuildModel.findOne({ guildId: i.guild!.id });
      const caseDoc = await createCase({ guildId: i.guild!.id, type: 'KICK', userId, userTag: member.user.tag, moderatorId: i.user.id, moderatorTag: i.user.tag, reason });
      const logEmbed = new EmbedBuilder().setColor(Colors.KICK).setTitle(`${E.Kick} Member Kicked`).addFields({ name: `${E.Member} User`, value: member.user.tag }, { name: `${E.Crown} Moderator`, value: i.user.tag }, { name: `${E.Reason} Reason`, value: reason });
      await sendModLog(i.guild!, logEmbed, guildData);
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} ${member.user.tag} has been kicked`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed to kick: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== MUTE ====================
  if (id.startsWith('velora_mute_duration_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const userId = parts[3];
    const reason = decodeURIComponent(parts[4] || '');
    const duration = (i as any).values?.[0];
    await i.deferUpdate();
    const guildData = await GuildModel.findOne({ guildId: i.guild!.id });
    try {
      const member = await i.guild!.members.fetch(userId);
      if (duration === 'perm') {
        const muteRole = guildData?.roles?.muteRole;
        if (muteRole) await member.roles.add(muteRole, reason);
        const caseDoc = await createCase({ guildId: i.guild!.id, type: 'MUTE', userId, userTag: member.user.tag, moderatorId: i.user.id, moderatorTag: i.user.tag, reason });
        await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} ${member.user.tag} muted permanently`)], components: [] });
      } else {
        const ms = parseInt(duration);
        await member.timeout(ms, reason);
        const caseDoc = await createCase({ guildId: i.guild!.id, type: 'TIMEOUT', userId, userTag: member.user.tag, moderatorId: i.user.id, moderatorTag: i.user.tag, reason, duration: formatDuration(ms), expiresAt: new Date(Date.now() + ms) });
        await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} ${member.user.tag} timed out for ${formatDuration(ms)}`)], components: [] });
      }
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed to mute: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  if (id.startsWith('velora_unmute_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const userId = parts[3];
    const reason = decodeURIComponent(parts[4] || '');
    await i.deferUpdate();
    const guildData = await GuildModel.findOne({ guildId: i.guild!.id });
    try {
      const member = await i.guild!.members.fetch(userId);
      if (member.communicationDisabledUntilTimestamp) await member.timeout(null, reason);
      const muteRole = guildData?.roles?.muteRole;
      if (muteRole && member.roles.cache.has(muteRole)) await member.roles.remove(muteRole, reason);
      const caseDoc = await createCase({ guildId: i.guild!.id, type: 'UNMUTE', userId, userTag: member.user.tag, moderatorId: i.user.id, moderatorTag: i.user.tag, reason });
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} ${member.user.tag} has been unmuted`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed to unmute: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== WARN ====================
  if (id.startsWith('velora_warn_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const userId = parts[3];
    const reason = decodeURIComponent(parts[4] || '');
    await i.deferUpdate();
    const guildData = await GuildModel.findOne({ guildId: i.guild!.id });
    const target = await client.users.fetch(userId).catch(() => null);
    await WarnModel.findOneAndUpdate({ guildId: i.guild!.id, userId }, { $push: { warnings: { reason, moderatorId: i.user.id, moderatorTag: i.user.tag } } }, { upsert: true });
    const caseDoc = await createCase({ guildId: i.guild!.id, type: 'WARN', userId, userTag: target?.tag, moderatorId: i.user.id, moderatorTag: i.user.tag, reason });
    const logEmbed = new EmbedBuilder().setColor(Colors.WARN).setTitle(`${E.Warn} Member Warned`).addFields({ name: `${E.Member} User`, value: target?.tag || userId }, { name: `${E.Reason} Reason`, value: reason });
    await sendModLog(i.guild!, logEmbed, guildData);

    // Check warn thresholds
    const warnDoc = await WarnModel.findOne({ guildId: i.guild!.id, userId });
    const activeWarns = (warnDoc?.warnings || []).filter((w: any) => w.active).length;
    const punishDoc = await WarnPunishModel.findOne({ guildId: i.guild!.id });
    const trigger = punishDoc?.punishments?.find((p: any) => p.count === activeWarns);
    if (trigger) {
      const member = await i.guild!.members.fetch(userId).catch(() => null);
      if (member) {
        if (trigger.action === 'kick') await member.kick(`Auto-punishment: ${activeWarns} warnings`).catch(() => {});
        else if (trigger.action === 'ban') await member.ban({ reason: `Auto-punishment: ${activeWarns} warnings` }).catch(() => {});
        else if (trigger.action === 'mute') {
          const muteRole = guildData?.roles?.muteRole;
          if (muteRole) await member.roles.add(muteRole).catch(() => {});
        }
      }
    }
    await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} ${target?.tag || userId} has been warned`)], components: [] });
    return;
  }

  // ==================== CLEARWARN ====================
  if (id.startsWith('velora_clearwarn_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const userId = parts[3];
    const warnId = parts[4];
    await i.deferUpdate();
    if (warnId === 'all') {
      await WarnModel.updateOne({ guildId: i.guild!.id, userId }, { $set: { 'warnings.$[].active': false } });
    } else {
      await WarnModel.updateOne({ guildId: i.guild!.id, userId, 'warnings.warnId': warnId }, { $set: { 'warnings.$.active': false } });
    }
    await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Warning(s) cleared`)], components: [] });
    return;
  }

  // ==================== SOFTBAN ====================
  if (id.startsWith('velora_softban_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const userId = parts[3];
    const deleteDays = parseInt(parts[4]);
    const reason = decodeURIComponent(parts[5] || '');
    await i.deferUpdate();
    const target = await client.users.fetch(userId).catch(() => null);
    const guildData = await GuildModel.findOne({ guildId: i.guild!.id });
    try {
      await i.guild!.members.ban(userId, { reason, deleteMessageSeconds: deleteDays * 86400 });
      await i.guild!.members.unban(userId, `Softban by ${i.user.tag}`);
      const caseDoc = await createCase({ guildId: i.guild!.id, type: 'SOFTBAN', userId, userTag: target?.tag, moderatorId: i.user.id, moderatorTag: i.user.tag, reason });
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} ${target?.tag || userId} has been softbanned`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Softban failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== NICK ====================
  if (id.startsWith('velora_nick_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const userId = parts[3];
    const newNick = decodeURIComponent(parts[4] || '') || null;
    await i.deferUpdate();
    try {
      const member = await i.guild!.members.fetch(userId);
      await member.setNickname(newNick, `By ${i.user.tag}`);
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Nickname ${newNick ? 'set' : 'reset'}`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== ROLE ADD/REMOVE ====================
  if (id.startsWith('velora_role_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const userId = parts[3];
    const action = parts[4];
    const roleId = parts[5];
    await i.deferUpdate();
    try {
      const member = await i.guild!.members.fetch(userId);
      const role = i.guild!.roles.cache.get(roleId);
      if (!role) throw new Error('Role not found');
      if (action === 'add') await member.roles.add(role);
      else await member.roles.remove(role);
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Role ${action === 'add' ? 'added' : 'removed'}`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== TIMEOUT ====================
  if (id.startsWith('velora_timeout_duration_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const userId = parts[3];
    const reason = decodeURIComponent(parts[4] || '');
    const ms = parseInt((i as any).values?.[0] || '0');
    await i.deferUpdate();
    try {
      const member = await i.guild!.members.fetch(userId);
      await member.timeout(ms, reason);
      const caseDoc = await createCase({ guildId: i.guild!.id, type: 'TIMEOUT', userId, userTag: member.user.tag, moderatorId: i.user.id, moderatorTag: i.user.tag, reason, duration: formatDuration(ms) });
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Timeout applied for ${formatDuration(ms)}`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  if (id.startsWith('velora_timeout_remove_')) {
    if (!checkUser(i, id)) return;
    const userId = id.split('_')[3];
    await i.deferUpdate();
    try {
      const member = await i.guild!.members.fetch(userId);
      await member.timeout(null);
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Timeout removed`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== LOCK/UNLOCK ====================
  if (id.startsWith('velora_lock_toggle_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const channelId = parts[3];
    const action = parts[4];
    const reason = decodeURIComponent(parts[5] || '');
    await i.deferUpdate();
    try {
      const channel = i.guild!.channels.cache.get(channelId) as any;
      const everyone = i.guild!.roles.everyone;
      if (action === 'lock') {
        await channel.permissionOverwrites.edit(everyone, { SendMessages: false }, { reason });
      } else {
        await channel.permissionOverwrites.edit(everyone, { SendMessages: null }, { reason });
      }
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Channel ${action === 'lock' ? 'locked' : 'unlocked'}`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== HIDE/SHOW ====================
  if (id.startsWith('velora_hide_toggle_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const channelId = parts[3];
    const action = parts[4];
    const reason = decodeURIComponent(parts[5] || '');
    await i.deferUpdate();
    try {
      const channel = i.guild!.channels.cache.get(channelId) as any;
      const everyone = i.guild!.roles.everyone;
      if (action === 'hide') {
        await channel.permissionOverwrites.edit(everyone, { ViewChannel: false }, { reason });
      } else {
        await channel.permissionOverwrites.edit(everyone, { ViewChannel: null }, { reason });
      }
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Channel ${action === 'hide' ? 'hidden' : 'shown'}`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== PURGE ====================
  if (id.startsWith('velora_purge_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const amount = parseInt(parts[3]);
    const filter = parts[4];
    await i.deferUpdate();
    try {
      const messages = await (i.channel as any).messages.fetch({ limit: amount + 1 });
      let toDelete = [...messages.values()];
      const now = Date.now();
      toDelete = toDelete.filter((m: any) => now - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);
      if (filter === 'bots') toDelete = toDelete.filter((m: any) => m.author.bot);
      else if (filter === 'humans') toDelete = toDelete.filter((m: any) => !m.author.bot);
      else if (filter === 'embeds') toDelete = toDelete.filter((m: any) => m.embeds.length > 0);
      else if (filter === 'images') toDelete = toDelete.filter((m: any) => m.attachments.size > 0);
      else if (filter === 'links') toDelete = toDelete.filter((m: any) => /https?:\/\//.test(m.content));
      toDelete = toDelete.slice(0, amount);
      await (i.channel as any).bulkDelete(toDelete, true);
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Purged ${toDelete.length} messages`)], components: [] });
      setTimeout(() => i.deleteReply().catch(() => {}), 3000);
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Purge failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== MASSBAN ====================
  if (id.startsWith('velora_massban_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const ids = decodeURIComponent(parts[3]).split(',');
    const reason = decodeURIComponent(parts[4] || '');
    await i.deferUpdate();
    let banned = 0, failed = 0;
    const guildData = await GuildModel.findOne({ guildId: i.guild!.id });
    for (const uid of ids) {
      try {
        await i.guild!.members.ban(uid, { reason });
        await createCase({ guildId: i.guild!.id, type: 'BAN', userId: uid, moderatorId: i.user.id, moderatorTag: i.user.tag, reason });
        banned++;
      } catch { failed++; }
    }
    await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.BanHammer} Mass Ban Complete`).addFields({ name: 'Banned', value: `${banned}`, inline: true }, { name: 'Failed', value: `${failed}`, inline: true })], components: [] });
    return;
  }

  // ==================== MASSKICK ====================
  if (id.startsWith('velora_masskick_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const ids = decodeURIComponent(parts[3]).split(',');
    const reason = decodeURIComponent(parts[4] || '');
    await i.deferUpdate();
    let kicked = 0, failed = 0;
    for (const uid of ids) {
      try {
        const member = await i.guild!.members.fetch(uid).catch(() => null);
        if (member) { await member.kick(reason); kicked++; }
        else failed++;
      } catch { failed++; }
    }
    await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Kick} Mass Kick Complete`).addFields({ name: 'Kicked', value: `${kicked}`, inline: true }, { name: 'Failed', value: `${failed}`, inline: true })], components: [] });
    return;
  }

  // ==================== DEHOIST ====================
  if (id.startsWith('velora_dehoist_start_')) {
    if (!checkUser(i, id)) return;
    await i.deferUpdate();
    const HOIST_CHARS = /^[!"#$%&'()*+,\-.\/]/;
    let count = 0;
    for (const [, member] of i.guild!.members.cache) {
      if (HOIST_CHARS.test(member.displayName)) {
        try { await member.setNickname(`\u17B5${member.displayName}`, 'Dehoist'); count++; } catch {}
      }
    }
    await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Dehoisted ${count} members`)], components: [] });
    return;
  }

  // ==================== STRIP ====================
  if (id.startsWith('velora_strip_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const userId = parts[3];
    const reason = decodeURIComponent(parts[4] || '');
    await i.deferUpdate();
    try {
      const member = await i.guild!.members.fetch(userId);
      const roles = member.roles.cache.filter((r: any) => r.id !== i.guild!.id && r.managed === false);
      await member.roles.remove([...roles.keys()], reason);
      const guildData = await GuildModel.findOne({ guildId: i.guild!.id });
      await createCase({ guildId: i.guild!.id, type: 'STRIP', userId, userTag: member.user.tag, moderatorId: i.user.id, moderatorTag: i.user.tag, reason });
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} ${roles.size} roles stripped from ${member.user.tag}`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== NUKE ====================
  if (id.startsWith('velora_nuke_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const channelId = parts[3];
    const reason = decodeURIComponent(parts[4] || '');
    await i.deferUpdate();
    try {
      const channel = i.guild!.channels.cache.get(channelId) as any;
      const clone = await channel.clone({ reason });
      await channel.delete(reason);
      const nukeEmbed = new EmbedBuilder().setColor(Colors.BAN).setTitle(`${E.Purge} Channel Nuked`).setDescription(`This channel was nuked by ${i.user.tag}.`).setFooter({ text: reason });
      await clone.send({ embeds: [nukeEmbed] });
      // We can't update reply since channel is deleted, just attempt
      await i.followUp({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Channel nuked successfully`)], ephemeral: true }).catch(() => {});
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Nuke failed: ${e.message}`, embeds: [], components: [] }).catch(() => {});
    }
    return;
  }

  // ==================== CLONE ====================
  if (id.startsWith('velora_clone_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const channelId = parts[3];
    const newName = decodeURIComponent(parts[4] || 'clone');
    await i.deferUpdate();
    try {
      const channel = i.guild!.channels.cache.get(channelId) as any;
      const clone = await channel.clone({ name: newName, reason: `Cloned by ${i.user.tag}` });
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Channel cloned: ${clone}`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Clone failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== PIN ====================
  if (id.startsWith('velora_pin_toggle_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const channelId = parts[3];
    const msgId = parts[4];
    const action = parts[5];
    await i.deferUpdate();
    try {
      const ch = i.guild!.channels.cache.get(channelId) as any;
      const msg = await ch.messages.fetch(msgId);
      if (action === 'pin') await msg.pin();
      else await msg.unpin();
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Message ${action === 'pin' ? 'pinned' : 'unpinned'}`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== LOCKDOWN ====================
  if (id.startsWith('velora_lockdown_toggle_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const action = parts[3];
    const reason = decodeURIComponent(parts[4] || '');
    await i.deferUpdate();
    const everyone = i.guild!.roles.everyone;
    const textChannels = i.guild!.channels.cache.filter((c: any) => c.type === 0);
    let processed = 0;
    for (const [, ch] of textChannels) {
      try {
        if (action === 'activate') await (ch as any).permissionOverwrites.edit(everyone, { SendMessages: false }, { reason });
        else await (ch as any).permissionOverwrites.edit(everyone, { SendMessages: null }, { reason });
        processed++;
      } catch {}
    }
    await GuildModel.findOneAndUpdate({ guildId: i.guild!.id }, { panicMode: action === 'activate' });
    await i.editReply({ embeds: [new EmbedBuilder().setColor(action === 'activate' ? Colors.BAN : Colors.SUCCESS).setTitle(`${E.Tick} Lockdown ${action === 'activate' ? 'activated' : 'lifted'} (${processed} channels)`)], components: [] });
    return;
  }

  // ==================== EDITREASON ====================
  if (id.startsWith('velora_editreason_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const caseId = parseInt(parts[3]);
    const newReason = decodeURIComponent(parts[4] || '');
    await i.deferUpdate();
    await CaseModel.findOneAndUpdate({ guildId: i.guild!.id, caseId }, { reason: newReason });
    await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Case #${caseId} reason updated`)], components: [] });
    return;
  }

  // ==================== DELETE NOTE ====================
  if (id.startsWith('velora_deletenote_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const userId = parts[3];
    const noteId = parts[4];
    await i.deferUpdate();
    await NoteModel.updateOne({ guildId: i.guild!.id, userId }, { $pull: { notes: { noteId } } });
    await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Note deleted`)], components: [] });
    return;
  }

  // ==================== TEMPROLE ====================
  if (id.startsWith('velora_temprole_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const userId = parts[3];
    const roleId = parts[4];
    const ms = parseInt(parts[5]);
    await i.deferUpdate();
    try {
      const member = await i.guild!.members.fetch(userId);
      const role = i.guild!.roles.cache.get(roleId);
      if (!role) throw new Error('Role not found');
      await member.roles.add(role);
      const expiresAt = new Date(Date.now() + ms);
      await TempRoleModel.create({ guildId: i.guild!.id, userId, roleId, expiresAt, grantedBy: i.user.id });
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Temp role granted for ${formatDuration(ms)}`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== GLOBAL BAN ====================
  if (id.startsWith('velora_globalban_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const userId = parts[3];
    const reason = decodeURIComponent(parts[4] || '');
    await i.deferUpdate();
    const target = await client.users.fetch(userId).catch(() => null);
    await GlobalBanModel.findOneAndUpdate({ userId }, { userId, userTag: target?.tag || userId, reason, addedBy: i.user.tag, $addToSet: { guilds: i.guild!.id } }, { upsert: true });
    await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} ${target?.tag || userId} added to global ban list`)], components: [] });
    return;
  }

  // ==================== CREATE CHANNEL ====================
  if (id.startsWith('velora_createchannel_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const name = decodeURIComponent(parts[3]);
    const type = parseInt(parts[4]);
    await i.deferUpdate();
    try {
      const ch = await i.guild!.channels.create({ name, type: type as any });
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Channel created: ${ch}`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== DELETE CHANNEL ====================
  if (id.startsWith('velora_deletechannel_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const channelId = parts[3];
    const reason = decodeURIComponent(parts[4] || '');
    await i.deferUpdate();
    try {
      const ch = i.guild!.channels.cache.get(channelId);
      const name = (ch as any)?.name;
      await ch?.delete(reason);
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Channel #${name} deleted`)], components: [] }).catch(() => {});
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed: ${e.message}`, embeds: [], components: [] }).catch(() => {});
    }
    return;
  }

  // ==================== RENAME CHANNEL ====================
  if (id.startsWith('velora_renamechannel_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const channelId = parts[3];
    const newName = decodeURIComponent(parts[4] || '');
    await i.deferUpdate();
    try {
      const ch = i.guild!.channels.cache.get(channelId) as any;
      await ch.setName(newName);
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Channel renamed to ${newName}`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== EMOJI DELETE ====================
  if (id.startsWith('velora_emojidelete_confirm_')) {
    if (!checkUser(i, id)) return;
    const emojiId = id.split('_')[3];
    await i.deferUpdate();
    try {
      const emoji = i.guild!.emojis.cache.get(emojiId);
      await emoji?.delete();
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Emoji deleted`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== SAY ====================
  if (id.startsWith('velora_say_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const channelId = parts[3];
    const message = decodeURIComponent(parts[4] || '');
    const asEmbed = parts[5] === '1';
    await i.deferUpdate();
    try {
      const ch = i.guild!.channels.cache.get(channelId) as any;
      if (asEmbed) {
        await ch.send({ embeds: [new EmbedBuilder().setColor(Colors.INFO).setDescription(message)] });
      } else {
        await ch.send({ content: message });
      }
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Message sent`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== MOVE MESSAGE ====================
  if (id.startsWith('velora_move_confirm_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const srcChannelId = parts[3];
    const msgId = parts[4];
    const targetChannelId = parts[5];
    await i.deferUpdate();
    try {
      const srcCh = i.guild!.channels.cache.get(srcChannelId) as any;
      const tgtCh = i.guild!.channels.cache.get(targetChannelId) as any;
      const msg = await srcCh.messages.fetch(msgId);
      const embed = new EmbedBuilder().setColor(Colors.INFO).setDescription(msg.content || '[no text]').setAuthor({ name: msg.author.tag, iconURL: msg.author.displayAvatarURL() }).setFooter({ text: `Moved from #${srcCh.name} by ${i.user.tag}` });
      await tgtCh.send({ embeds: [embed] });
      await msg.delete();
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Message moved`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== POLL VOTE ====================
  if (id.startsWith('velora_poll_vote_')) {
    const parts = id.split('_');
    const pollId = parts[3];
    const optionIdx = parseInt(parts[4]);
    const PollModel = require('../../schemas/Poll').default;
    const poll = await PollModel.findById(pollId);
    if (!poll || poll.ended) return i.reply({ content: `${E.Cross} This poll has ended or doesn't exist.`, ephemeral: true });
    const hasVoted = poll.options.some((o: any) => o.votes.includes(i.user.id));
    if (hasVoted && !poll.multi) return i.reply({ content: `${E.Cross} You already voted.`, ephemeral: true });
    await PollModel.findByIdAndUpdate(pollId, { $addToSet: { [`options.${optionIdx}.votes`]: i.user.id } });
    const updated = await PollModel.findById(pollId);
    const total = updated.options.reduce((a: number, o: any) => a + o.votes.length, 0);
    const desc = updated.options.map((o: any, idx: number) => {
      const pct = total > 0 ? Math.round((o.votes.length / total) * 100) : 0;
      const bar = '█'.repeat(Math.round(pct / 5)).padEnd(20, '░');
      return `${idx + 1}. **${o.label}** — ${o.votes.length} votes (${pct}%)\n${bar}`;
    }).join('\n\n');
    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Percentage} ${updated.question}`).setDescription(desc).setFooter({ text: `${total} total votes` });
    await i.update({ embeds: [embed] });
    return;
  }

  // ==================== BATTLE JOIN ====================
  if (id.startsWith('velora_battle_join_')) {
    const battleId = id.split('_')[3];
    const BattleModel = require('../../schemas/Battle').default;
    const battle = await BattleModel.findOne({ battleId });
    if (!battle || battle.status !== 'waiting') return i.reply({ content: `${E.Cross} Battle is not accepting participants.`, ephemeral: true });
    if (battle.participants.some((p: any) => p.userId === i.user.id)) return i.reply({ content: `${E.Cross} You already joined.`, ephemeral: true });
    await BattleModel.findOneAndUpdate({ battleId }, { $push: { participants: { userId: i.user.id, userTag: i.user.tag, joinedAt: new Date(), alive: true } } });
    const updated = await BattleModel.findOne({ battleId });
    const count = updated.participants.length;
    const prevEmbed = i.message.embeds[0];
    const embed = new EmbedBuilder().setColor(Colors.BATTLE).setTitle(`${E.Crown} Battle Royale — ${battle.era} Era`)
      .setDescription(`Participants: **${count}**\nClick **Join Battle** to participate!`)
      .addFields({ name: `${E.Crown} Host`, value: battle.hostTag }, { name: `${E.Loading} Status`, value: 'Waiting for players' });
    await i.update({ embeds: [embed] });
    return;
  }

  // ==================== BATTLE START ====================
  if (id.startsWith('velora_battle_start_')) {
    if (!checkUser(i, id)) return;
    const battleId = id.split('_')[3];
    const BattleModel = require('../../schemas/Battle').default;
    const battle = await BattleModel.findOne({ battleId });
    if (!battle || battle.status !== 'waiting') return i.reply({ content: `${E.Cross} Battle cannot be started.`, ephemeral: true });
    if (battle.participants.length < 2) return i.reply({ content: `${E.Cross} Need at least 2 participants.`, ephemeral: true });
    await BattleModel.findOneAndUpdate({ battleId }, { status: 'active', startedAt: new Date() });
    await i.update({ embeds: [new EmbedBuilder().setColor(Colors.BATTLE).setTitle(`${E.Crown} BATTLE STARTED!`).setDescription(`${battle.participants.length} warriors enter, only one will survive!`)], components: [] });
    return;
  }

  // ==================== PANIC ====================
  if (id.startsWith('velora_panic_activate_') || id.startsWith('velora_panic_lift_')) {
    if (!checkUser(i, id)) return;
    const action = id.includes('_activate_') ? 'activate' : 'lift';
    const reason = decodeURIComponent(id.split('_')[3] || '');
    await i.deferUpdate();
    const everyone = i.guild!.roles.everyone;
    let processed = 0;
    for (const [, ch] of i.guild!.channels.cache) {
      if ((ch as any).type !== 0) continue;
      try {
        if (action === 'activate') await (ch as any).permissionOverwrites.edit(everyone, { SendMessages: false });
        else await (ch as any).permissionOverwrites.edit(everyone, { SendMessages: null });
        processed++;
      } catch {}
    }
    await GuildModel.findOneAndUpdate({ guildId: i.guild!.id }, { panicMode: action === 'activate' });
    await i.editReply({ embeds: [new EmbedBuilder().setColor(action === 'activate' ? '#FF0000' : Colors.SUCCESS).setTitle(`${E.Tick} Panic mode ${action === 'activate' ? 'activated' : 'lifted'} (${processed} channels)`)], components: [] });
    return;
  }

  // ==================== CANCEL (generic) ====================
  if (id.includes('_cancel_')) {
    if (!checkUser(i, id)) return;
    await i.update({ embeds: [new EmbedBuilder().setColor(Colors.NEUTRAL).setTitle(`${E.Cross} Cancelled`)], components: [] });
    return;
  }

  // ==================== WELCOME TOGGLE ====================
  if (id.startsWith('velora_welcome_toggle_')) {
    if (!checkUser(i, id)) return;
    await i.deferUpdate();
    const gd = await GuildModel.findOne({ guildId: i.guild!.id });
    const current = gd?.settings?.welcome?.enabled;
    await GuildModel.findOneAndUpdate({ guildId: i.guild!.id }, { $set: { 'settings.welcome.enabled': !current } });
    await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Welcome ${!current ? 'enabled' : 'disabled'}`)], components: [] });
    return;
  }

  // ==================== ANTIRAID TOGGLE ====================
  if (id.startsWith('velora_antiraid_toggle_')) {
    if (!checkUser(i, id)) return;
    await i.deferUpdate();
    const gd = await GuildModel.findOne({ guildId: i.guild!.id });
    const current = gd?.settings?.antiraid?.enabled;
    await GuildModel.findOneAndUpdate({ guildId: i.guild!.id }, { $set: { 'settings.antiraid.enabled': !current } });
    await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Anti-raid ${!current ? 'enabled' : 'disabled'}`)], components: [] });
    return;
  }

  // ==================== ANTINUKE TOGGLE ====================
  if (id.startsWith('velora_antinuke_toggle_')) {
    if (!checkUser(i, id)) return;
    await i.deferUpdate();
    const gd = await GuildModel.findOne({ guildId: i.guild!.id });
    const current = gd?.settings?.antinuke?.enabled;
    await GuildModel.findOneAndUpdate({ guildId: i.guild!.id }, { $set: { 'settings.antinuke.enabled': !current } });
    await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Anti-nuke ${!current ? 'enabled' : 'disabled'}`)], components: [] });
    return;
  }

  // ==================== LOGS TOGGLE ====================
  if (id.startsWith('velora_logs_toggle_')) {
    if (!checkUser(i, id)) return;
    await i.deferUpdate();
    const gd = await GuildModel.findOne({ guildId: i.guild!.id });
    const current = gd?.settings?.logging?.enabled;
    await GuildModel.findOneAndUpdate({ guildId: i.guild!.id }, { $set: { 'settings.logging.enabled': !current } });
    await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Logging ${!current ? 'enabled' : 'disabled'}`)], components: [] });
    return;
  }

  // ==================== TICKET CLOSE ====================
  if (id.startsWith('velora_ticket_close_')) {
    if (!checkUser(i, id)) return;
    const ticketId = parseInt(id.split('_')[3]);
    await i.deferUpdate();
    const TicketModel = require('../../schemas/Ticket').default;
    await TicketModel.findOneAndUpdate({ guildId: i.guild!.id, ticketId }, { status: 'closed', closedBy: i.user.tag, closedAt: new Date() });
    await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Ticket #${ticketId} closed`)], components: [] });
    return;
  }

  // ==================== TICKET SEND PANEL ====================
  if (id.startsWith('velora_ticket_sendpanel_')) {
    if (!checkUser(i, id)) return;
    await i.deferUpdate();
    const gd = await GuildModel.findOne({ guildId: i.guild!.id });
    const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = await import('discord.js');
    const panelEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${E.Ticket} Support Tickets`)
      .setDescription('Need help? Click the button below to open a support ticket.\nOur team will assist you as soon as possible.')
      .setFooter({ text: i.guild!.name, iconURL: i.guild!.iconURL() || undefined });
    const createBtn = new ButtonBuilder()
      .setCustomId('velora_ticket_create_PUBLIC')
      .setLabel('Create Ticket')
      .setStyle(ButtonStyle.Primary);
    const panelRow = new ActionRowBuilder<any>().addComponents(createBtn);
    const ch = i.channel as any;
    await ch.send({ embeds: [panelEmbed], components: [panelRow] });
    await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Ticket panel sent!`)], components: [] });
    return;
  }

  // ==================== TICKET CREATE (PUBLIC) ====================
  if (id === 'velora_ticket_create_PUBLIC') {
    const gd = await GuildModel.findOne({ guildId: i.guild!.id });
    if (!gd?.settings?.tickets?.enabled) {
      return i.reply({ content: `${E.Cross} Ticket system is not enabled.`, ephemeral: true });
    }
    const TicketModel = require('../../schemas/Ticket').default;
    const existing = await TicketModel.findOne({ guildId: i.guild!.id, userId: i.user.id, status: 'open' });
    if (existing) {
      return i.reply({ content: `${E.Cross} You already have an open ticket: <#${existing.channelId}>`, ephemeral: true });
    }
    await i.deferReply({ ephemeral: true });
    const counter = (gd?.settings?.tickets?.counter || 0) + 1;
    await GuildModel.findOneAndUpdate({ guildId: i.guild!.id }, { $inc: { 'settings.tickets.counter': 1 } });
    const { ChannelType, PermissionFlagsBits } = await import('discord.js');
    const supportRoles = gd?.settings?.tickets?.supportRoles || [];
    const overwrites: any[] = [
      { id: i.guild!.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      { id: i.guild!.members.me!.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
    ];
    for (const roleId of supportRoles) {
      overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
    }
    try {
      const ch = await i.guild!.channels.create({
        name: `ticket-${counter}`,
        type: ChannelType.GuildText,
        parent: gd?.channels?.ticketCategory || undefined,
        permissionOverwrites: overwrites,
        reason: `Ticket #${counter} by ${i.user.tag}`,
      });
      await TicketModel.create({ guildId: i.guild!.id, userId: i.user.id, userTag: i.user.tag, channelId: ch.id, ticketId: counter, status: 'open' });
      const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = await import('discord.js');
      const ticketEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`${E.Ticket} Ticket #${counter}`)
        .setDescription(`Hello ${i.user}! Support staff will be with you shortly.\nDescribe your issue below.`)
        .addFields({ name: 'Opened by', value: `${i.user.tag}`, inline: true }, { name: 'Ticket ID', value: `#${counter}`, inline: true });
      const closeBtn = new ButtonBuilder().setCustomId(`velora_ticket_close_${counter}_${i.user.id}`).setLabel('Close Ticket').setStyle(ButtonStyle.Danger);
      const ticketRow = new ActionRowBuilder<any>().addComponents(closeBtn);
      await ch.send({ content: `${i.user} ${supportRoles.map((r: string) => `<@&${r}>`).join(' ')}`, embeds: [ticketEmbed], components: [ticketRow] });
      await i.editReply({ content: `${E.Tick} Your ticket has been created: ${ch}` });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed to create ticket: ${e.message}` });
    }
    return;
  }

  // ==================== TICKET DELETE ====================
  if (id.startsWith('velora_ticket_delete_')) {
    if (!checkUser(i, id)) return;
    await i.deferUpdate();
    try {
      await i.channel?.delete('Ticket deleted by moderator');
    } catch {}
    return;
  }

  // ==================== VERIFY BUTTON (PUBLIC) ====================
  if (id === 'velora_verify_button_PUBLIC') {
    const gd = await GuildModel.findOne({ guildId: i.guild!.id });
    if (!gd?.settings?.verification?.enabled) {
      return i.reply({ content: `${E.Cross} Verification is not enabled.`, ephemeral: true });
    }
    const verifiedRoleId = gd?.roles?.verifiedRole;
    if (!verifiedRoleId) {
      return i.reply({ content: `${E.Cross} No verified role configured. Ask an admin to run \`??setrole\`.`, ephemeral: true });
    }
    const member = i.member as any;
    if (member.roles.cache.has(verifiedRoleId)) {
      return i.reply({ content: `${E.Tick} You are already verified!`, ephemeral: true });
    }
    try {
      await member.roles.add(verifiedRoleId, 'Verified via button');
      await i.reply({ content: `${E.Tick} You have been verified! Welcome to **${i.guild!.name}**.`, ephemeral: true });
    } catch (e: any) {
      await i.reply({ content: `${E.Cross} Failed to verify: ${e.message}`, ephemeral: true });
    }
    return;
  }

  // ==================== SETTINGS — PREFIX ====================
  if (id.startsWith('velora_settings_prefix_')) {
    if (!checkUser(i, id)) return;
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
    const modal = new ModalBuilder().setCustomId(`velora_prefix_modal_${i.user.id}`).setTitle('Change Prefix');
    const input = new TextInputBuilder().setCustomId('prefix').setLabel('New Prefix (1-3 characters)').setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(3).setPlaceholder('e.g. ! or ?? or .').setRequired(true);
    modal.addComponents(new ActionRowBuilder<any>().addComponents(input));
    await i.showModal(modal);
    return;
  }

  // ==================== SETTINGS — ROLES ====================
  if (id.startsWith('velora_settings_roles_')) {
    if (!checkUser(i, id)) return;
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
    const modal = new ModalBuilder().setCustomId(`velora_settings_roles_modal_${i.user.id}`).setTitle('Configure Roles');
    const modInput  = new TextInputBuilder().setCustomId('mod_role_id').setLabel('Moderator Role ID').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('Paste role ID');
    const adminInput = new TextInputBuilder().setCustomId('admin_role_id').setLabel('Admin Role ID').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('Paste role ID');
    const muteInput  = new TextInputBuilder().setCustomId('mute_role_id').setLabel('Muted Role ID').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('Paste role ID');
    const verInput   = new TextInputBuilder().setCustomId('verified_role_id').setLabel('Verified Role ID').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('Paste role ID');
    modal.addComponents(
      new ActionRowBuilder<any>().addComponents(modInput),
      new ActionRowBuilder<any>().addComponents(adminInput),
      new ActionRowBuilder<any>().addComponents(muteInput),
      new ActionRowBuilder<any>().addComponents(verInput),
    );
    await i.showModal(modal);
    return;
  }

  // ==================== SETTINGS — CHANNELS ====================
  if (id.startsWith('velora_settings_channels_')) {
    if (!checkUser(i, id)) return;
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
    const modal = new ModalBuilder().setCustomId(`velora_settings_channels_modal_${i.user.id}`).setTitle('Configure Log Channels');
    const modLogs    = new TextInputBuilder().setCustomId('mod_logs_id').setLabel('Mod Logs Channel ID').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('Paste channel ID');
    const serverLogs = new TextInputBuilder().setCustomId('server_logs_id').setLabel('Server Logs Channel ID').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('Paste channel ID');
    const welcome    = new TextInputBuilder().setCustomId('welcome_id').setLabel('Welcome Channel ID').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('Paste channel ID');
    const goodbye    = new TextInputBuilder().setCustomId('goodbye_id').setLabel('Goodbye Channel ID').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('Paste channel ID');
    modal.addComponents(
      new ActionRowBuilder<any>().addComponents(modLogs),
      new ActionRowBuilder<any>().addComponents(serverLogs),
      new ActionRowBuilder<any>().addComponents(welcome),
      new ActionRowBuilder<any>().addComponents(goodbye),
    );
    await i.showModal(modal);
    return;
  }

  // ==================== SETTINGS — WELCOME ====================
  if (id.startsWith('velora_settings_welcome_')) {
    if (!checkUser(i, id)) return;
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
    const modal = new ModalBuilder().setCustomId(`velora_settings_welcome_modal_${i.user.id}`).setTitle('Welcome Settings');
    const msgInput = new TextInputBuilder().setCustomId('message').setLabel('Welcome Message').setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Use {user}, {guild}, {count} as placeholders').setRequired(false).setMaxLength(1000);
    modal.addComponents(new ActionRowBuilder<any>().addComponents(msgInput));
    await i.showModal(modal);
    return;
  }

  // ==================== SETTINGS — GOODBYE ====================
  if (id.startsWith('velora_settings_goodbye_')) {
    if (!checkUser(i, id)) return;
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
    const modal = new ModalBuilder().setCustomId(`velora_settings_goodbye_modal_${i.user.id}`).setTitle('Goodbye Settings');
    const msgInput = new TextInputBuilder().setCustomId('message').setLabel('Goodbye Message').setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Use {user}, {guild} as placeholders').setRequired(false).setMaxLength(1000);
    modal.addComponents(new ActionRowBuilder<any>().addComponents(msgInput));
    await i.showModal(modal);
    return;
  }

  // ==================== SETTINGS — AUTOROLE ====================
  if (id.startsWith('velora_settings_autorole_')) {
    if (!checkUser(i, id)) return;
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
    const modal = new ModalBuilder().setCustomId(`velora_settings_autorole_modal_${i.user.id}`).setTitle('Auto-Role Settings');
    const roleInput = new TextInputBuilder().setCustomId('role_ids').setLabel('Role IDs to auto-assign (comma separated)').setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('e.g. 123456789, 987654321').setRequired(false);
    modal.addComponents(new ActionRowBuilder<any>().addComponents(roleInput));
    await i.showModal(modal);
    return;
  }

  // ==================== TICKET SETUP BUTTON ====================
  if (id.startsWith('velora_ticket_setup_') && !id.includes('modal') && !id.includes('sendpanel')) {
    if (!checkUser(i, id)) return;
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
    const modal = new ModalBuilder().setCustomId(`velora_ticket_setup_modal_${i.user.id}`).setTitle('Ticket System Setup');
    const catInput     = new TextInputBuilder().setCustomId('category_id').setLabel('Ticket Category ID (optional)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('Paste category channel ID');
    const supportInput = new TextInputBuilder().setCustomId('support_roles').setLabel('Support Role IDs (comma-separated)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('e.g. 123456, 789012');
    modal.addComponents(
      new ActionRowBuilder<any>().addComponents(catInput),
      new ActionRowBuilder<any>().addComponents(supportInput),
    );
    await i.showModal(modal);
    return;
  }
}
