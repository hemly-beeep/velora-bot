import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'hide',
  aliases: ['h'],
  category: 'Moderation',
  description: 'Hide or show a channel.',
  usageSlash: '/hide [channel] [reason]',
  usagePrefix: '??hide [channel] [reason]',
  examples: ['??hide', '??hide #secret'],
  permissions: ['MANAGE_CHANNELS'],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('hide')
    .setDescription('Hide or show a channel from @everyone.')
    .addChannelOption(o => o.setName('channel').setDescription('Channel (defaults to current)'))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(ctx: any) {
    await ctx.defer();
    const channel = (ctx.isSlash ? ctx.interaction.options.getChannel('channel') : null) || ctx.channel;
    const reason = ctx.isSlash ? (ctx.interaction.options.getString('reason') || 'No reason provided') : (ctx.args.join(' ') || 'No reason provided');
    const everyoneRole = ctx.guild.roles.everyone;
    const overwrite = channel.permissionOverwrites?.cache?.get(everyoneRole.id);
    const isHidden = overwrite?.deny?.has(PermissionFlagsBits.ViewChannel);

    const embed = new EmbedBuilder().setColor(isHidden ? Colors.SUCCESS : Colors.BAN)
      .setTitle(isHidden ? `${E.Unlock} Show Channel` : `${E.Lock} Hide Channel`)
      .addFields({ name: `${E.Channel} Channel`, value: `${channel}` }, { name: `${E.Reason} Reason`, value: reason });

    const btn = new ButtonBuilder().setCustomId(`velora_hide_toggle_${channel.id}_${isHidden ? 'show' : 'hide'}_${encodeURIComponent(reason)}_${ctx.user.id}`).setLabel(isHidden ? 'Show Channel' : 'Hide Channel').setStyle(isHidden ? ButtonStyle.Success : ButtonStyle.Danger);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_hide_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(btn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};
