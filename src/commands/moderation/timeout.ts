import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'timeout',
  aliases: ['to'],
  category: 'Moderation',
  description: 'Apply or remove a timeout from a member.',
  usageSlash: '/timeout <user> [duration] [reason]',
  usagePrefix: '??timeout <user> [duration] [reason]',
  examples: ['??timeout @User 1h', '??to @User 30m Spamming'],
  permissions: ['MODERATE_MEMBERS'],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Apply or remove a timeout from a member.')
    .addUserOption(o => o.setName('user').setDescription('Member').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('Duration (e.g. 1h, 30m)'))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[0]);
    if (!target) return ctx.reply({ content: `${E.Cross} Could not find that user.`, ephemeral: true });
    const reason = ctx.isSlash ? (ctx.interaction.options.getString('reason') || 'No reason provided') : (ctx.args.slice(2).join(' ') || 'No reason provided');
    const member = await ctx.guild.members.fetch(target.id).catch(() => null);
    if (!member) return ctx.reply({ content: `${E.Cross} That user is not in this server.`, ephemeral: true });

    const inTimeout = member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now();
    if (inTimeout) {
      const embed = new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Unmute} Remove Timeout`).addFields({ name: `${E.Member} Member`, value: target.tag });
      const confirmBtn = new ButtonBuilder().setCustomId(`velora_timeout_remove_${target.id}_${encodeURIComponent(reason)}_${ctx.user.id}`).setLabel('Remove Timeout').setStyle(ButtonStyle.Success);
      const cancelBtn = new ButtonBuilder().setCustomId(`velora_timeout_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
      const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) attachAutoDisable(msg, rows, 30_000);
    } else {
      const durSelect = new StringSelectMenuBuilder().setCustomId(`velora_timeout_duration_${target.id}_${encodeURIComponent(reason)}_${ctx.user.id}`).setPlaceholder('Select timeout duration...').addOptions(
        { label: '60 seconds', value: '60000' }, { label: '5 minutes', value: '300000' },
        { label: '10 minutes', value: '600000' }, { label: '30 minutes', value: '1800000' },
        { label: '1 hour', value: '3600000' }, { label: '1 day', value: '86400000' },
        { label: '1 week', value: '604800000' },
      );
      const embed = new EmbedBuilder().setColor(Colors.TIMEOUT).setTitle(`${E.MuteIcon} Apply Timeout`).addFields({ name: `${E.Member} Member`, value: target.tag }, { name: `${E.Reason} Reason`, value: reason });
      const rows = withClose([new ActionRowBuilder<any>().addComponents(durSelect)], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) attachAutoDisable(msg, rows, 60_000);
    }
  },
};
