import { StringSelectMenuInteraction, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import GuildModel from '../../schemas/Guild';
import { parseDuration, formatDuration } from '../../utils/duration';
import { createCase, sendModLog } from '../../utils/modlog';

function getUserId(customId: string): string {
  return customId.split('_').at(-1) || '';
}

function checkUser(i: StringSelectMenuInteraction, customId: string): boolean {
  const id = getUserId(customId);
  if (!id || id === 'PUBLIC') return true;
  if (i.user.id !== id) {
    i.reply({ content: `${E.Cross} This menu is not for you.`, ephemeral: true }).catch(() => {});
    return false;
  }
  return true;
}

export async function handleDropdown(i: StringSelectMenuInteraction, client: any) {
  const id = i.customId;
  const value = i.values[0];

  // ==================== TEMPBAN DURATION ====================
  if (id.startsWith('velora_tempban_duration_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const userId = parts[3];
    const reason = decodeURIComponent(parts[4] || '');
    const ms = parseInt(value);
    await i.deferUpdate();
    const target = await client.users.fetch(userId).catch(() => null);
    const expiresAt = new Date(Date.now() + ms);
    const guildData = await GuildModel.findOne({ guildId: i.guild!.id });
    try {
      await i.guild!.members.ban(userId, { reason, deleteMessageSeconds: 0 });
      const caseDoc = await createCase({ guildId: i.guild!.id, type: 'TEMPBAN', userId, userTag: target?.tag, moderatorId: i.user.id, moderatorTag: i.user.tag, reason, duration: formatDuration(ms), expiresAt });
      const logEmbed = new EmbedBuilder().setColor(Colors.BAN).setTitle(`${E.BanHammer} Member Temp-Banned`).addFields({ name: `${E.Member} User`, value: `${target?.tag || userId}` }, { name: `${E.Loading} Duration`, value: formatDuration(ms) }, { name: `${E.Reason} Reason`, value: reason });
      await sendModLog(i.guild!, logEmbed, guildData);
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} ${target?.tag || userId} banned for ${formatDuration(ms)}`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== SLOWMODE PRESET ====================
  if (id.startsWith('velora_slowmode_preset_')) {
    if (!checkUser(i, id)) return;
    const parts = id.split('_');
    const channelId = parts[3];
    const reason = decodeURIComponent(parts[4] || '');
    const seconds = parseInt(value);
    await i.deferUpdate();
    try {
      const ch = i.guild!.channels.cache.get(channelId) as any;
      await ch.setRateLimitPerUser(seconds, reason);
      const label = seconds === 0 ? 'Off' : `${seconds}s`;
      await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Slowmode set to ${label}`)], components: [] });
    } catch (e: any) {
      await i.editReply({ content: `${E.Cross} Failed: ${e.message}`, embeds: [], components: [] });
    }
    return;
  }

  // ==================== SETLOGS SELECT ====================
  if (id.startsWith('velora_setlogs_select_')) {
    if (!checkUser(i, id)) return;
    const logType = value;
    const modal = new ModalBuilder().setCustomId(`velora_setlogs_modal_${logType}_${i.user.id}`).setTitle(`Set ${logType} Channel`);
    const input = new TextInputBuilder().setCustomId('channel_id').setLabel('Channel ID').setStyle(TextInputStyle.Short).setPlaceholder('Paste the channel ID here').setRequired(true);
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
    await i.showModal(modal);
    return;
  }

  // ==================== SETROLE SELECT ====================
  if (id.startsWith('velora_setrole_select_')) {
    if (!checkUser(i, id)) return;
    const roleType = value;
    const modal = new ModalBuilder().setCustomId(`velora_setrole_modal_${roleType}_${i.user.id}`).setTitle(`Set ${roleType}`);
    const input = new TextInputBuilder().setCustomId('role_id').setLabel('Role ID').setStyle(TextInputStyle.Short).setPlaceholder('Paste the role ID here').setRequired(true);
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
    await i.showModal(modal);
    return;
  }

  // ==================== AUTOMOD MODULE ====================
  if (id.startsWith('velora_automod_') && id.includes('_' + getUserId(id))) {
    if (!checkUser(i, id)) return;
    const module = id.replace('velora_automod_', '').replace(`_${getUserId(id)}`, '');
    await i.deferUpdate();
    const gd = await GuildModel.findOne({ guildId: i.guild!.id });
    const current = gd?.settings?.automod?.[module]?.enabled;
    await GuildModel.findOneAndUpdate({ guildId: i.guild!.id }, { $set: { [`settings.automod.${module}.enabled`]: !current } });
    await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} ${module} ${!current ? 'enabled' : 'disabled'}`)], components: [] });
    return;
  }

  // ==================== VERIFICATION TYPE ====================
  if (id.startsWith('velora_verification_type_')) {
    if (!checkUser(i, id)) return;
    await i.deferUpdate();
    await GuildModel.findOneAndUpdate({ guildId: i.guild!.id }, { $set: { 'settings.verification.type': value } });
    await i.editReply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Verification type set to ${value}`)], components: [] });
    return;
  }

  // ==================== HELP CATEGORY ====================
  if (id.startsWith('velora_help_category_')) {
    if (!checkUser(i, id)) return;
    const cat = value;
    const registry: Map<string, any> = client.commandRegistry;
    const cmds = [...new Set(registry.values())].filter((c: any) => c.category === cat);
    const prefix = (await GuildModel.findOne({ guildId: i.guild!.id }))?.prefix || '??';
    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Settings} ${cat} Commands`)
      .setDescription(cmds.map((c: any) => `**\`${prefix}${c.name}\`** — ${c.description || 'No description'}`).join('\n') || 'No commands found.');
    await i.update({ embeds: [embed] });
    return;
  }

  // ==================== WARNPUNISH ADD ====================
  if (id.startsWith('velora_warnpunish_add_')) {
    if (!checkUser(i, id)) return;
    const modal = new ModalBuilder().setCustomId(`velora_warnpunish_modal_${i.user.id}`).setTitle('Add Warn Punishment');
    const countInput = new TextInputBuilder().setCustomId('count').setLabel('Warning Count Threshold').setStyle(TextInputStyle.Short).setPlaceholder('e.g. 3').setRequired(true);
    const actionInput = new TextInputBuilder().setCustomId('action').setLabel('Action (mute/kick/ban/timeout)').setStyle(TextInputStyle.Short).setPlaceholder('kick').setRequired(true);
    const durationInput = new TextInputBuilder().setCustomId('duration').setLabel('Duration (for mute/timeout/tempban)').setStyle(TextInputStyle.Short).setPlaceholder('e.g. 1h or leave empty').setRequired(false);
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(countInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(actionInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(durationInput),
    );
    await i.showModal(modal);
    return;
  }

  // ==================== TICKET SETUP ====================
  if (id.startsWith('velora_ticket_setup_')) {
    if (!checkUser(i, id)) return;
    const modal = new ModalBuilder().setCustomId(`velora_ticket_setup_modal_${i.user.id}`).setTitle('Ticket Setup');
    const catInput = new TextInputBuilder().setCustomId('category_id').setLabel('Ticket Category ID').setStyle(TextInputStyle.Short).setRequired(false);
    const supportInput = new TextInputBuilder().setCustomId('support_roles').setLabel('Support Role IDs (comma-separated)').setStyle(TextInputStyle.Short).setRequired(false);
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(catInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(supportInput),
    );
    await i.showModal(modal);
    return;
  }
}
