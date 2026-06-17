import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'mute',
  aliases: ['m'],
  category: 'Moderation',
  description: 'Mute or unmute a member.',
  usageSlash: '/mute <user> [duration] [reason]',
  usagePrefix: '??mute <user> [duration] [reason]',
  examples: ['??mute @User 1h Being noisy', '??mute @User'],
  permissions: ['MANAGE_ROLES'],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute or unmute a member.')
    .addUserOption(o => o.setName('user').setDescription('Member to mute/unmute').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('Duration (e.g. 1h, 30m)'))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[0]);
    if (!target) return ctx.reply({ content: `${E.Cross} Could not find that user.`, ephemeral: true });
    const reason = ctx.isSlash ? (ctx.interaction.options.getString('reason') || 'No reason provided') : (ctx.args.slice(2).join(' ') || 'No reason provided');

    const member = await ctx.guild.members.fetch(target.id).catch(() => null);
    if (!member) return ctx.reply({ content: `${E.Cross} That user is not in this server.`, ephemeral: true });

    const muteRole = ctx.guildData?.roles?.muteRole;
    const isMuted = muteRole ? member.roles.cache.has(muteRole) : (member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now());

    if (isMuted) {
      const embed = new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Unmute} Unmute Confirmation`).addFields(
        { name: `${E.Member} Member`, value: `${target.tag}` },
        { name: `${E.Crown} Moderator`, value: ctx.user.tag },
        { name: `${E.Reason} Reason`, value: reason },
      );
      const confirmBtn = new ButtonBuilder().setCustomId(`velora_unmute_confirm_${target.id}_${encodeURIComponent(reason)}_${ctx.user.id}`).setLabel('Unmute').setStyle(ButtonStyle.Success);
      const cancelBtn = new ButtonBuilder().setCustomId(`velora_mute_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
      const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) attachAutoDisable(msg, rows, 30_000);
    } else {
      const embed = new EmbedBuilder().setColor(Colors.MUTE).setTitle(`${E.MuteIcon} Mute Confirmation`).addFields(
        { name: `${E.Member} Member`, value: `${target.tag}` },
        { name: `${E.Crown} Moderator`, value: ctx.user.tag },
        { name: `${E.Reason} Reason`, value: reason },
      );
      const durSelect = new StringSelectMenuBuilder().setCustomId(`velora_mute_duration_${target.id}_${encodeURIComponent(reason)}_${ctx.user.id}`).setPlaceholder('Select duration...').addOptions(
        { label: '10 Minutes', value: '10m' }, { label: '30 Minutes', value: '30m' },
        { label: '1 Hour', value: '1h' }, { label: '6 Hours', value: '6h' },
        { label: '12 Hours', value: '12h' }, { label: '1 Day', value: '1d' },
        { label: 'Permanent', value: 'perm' },
      );
      const rows = withClose([new ActionRowBuilder<any>().addComponents(durSelect)], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) attachAutoDisable(msg, rows, 60_000);
    }
  },
};
