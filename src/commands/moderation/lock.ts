import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'lock',
  aliases: ['l'],
  category: 'Moderation',
  description: 'Lock or unlock a channel.',
  usageSlash: '/lock [channel] [reason]',
  usagePrefix: '??lock [channel] [reason]',
  examples: ['??lock', '??lock #general Raid protection'],
  permissions: ['MANAGE_CHANNELS'],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock or unlock a channel.')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to lock (defaults to current)'))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(ctx: any) {
    await ctx.defer();
    const channel = (ctx.isSlash ? ctx.interaction.options.getChannel('channel') : null) || ctx.channel;
    const reason = ctx.isSlash ? (ctx.interaction.options.getString('reason') || 'No reason provided') : (ctx.args.join(' ') || 'No reason provided');
    const everyoneRole = ctx.guild.roles.everyone;
    const overwrite = channel.permissionOverwrites?.cache?.get(everyoneRole.id);
    const isLocked = overwrite?.deny?.has(PermissionFlagsBits.SendMessages);

    const embed = new EmbedBuilder().setColor(isLocked ? Colors.SUCCESS : Colors.BAN)
      .setTitle(isLocked ? `${E.Unlock} Unlock Channel` : `${E.Lock} Lock Channel`)
      .addFields({ name: `${E.Channel} Channel`, value: `${channel}` }, { name: `${E.Reason} Reason`, value: reason });

    const btn = new ButtonBuilder().setCustomId(`velora_lock_toggle_${channel.id}_${isLocked ? 'unlock' : 'lock'}_${encodeURIComponent(reason)}_${ctx.user.id}`).setLabel(isLocked ? 'Unlock Channel' : 'Lock Channel').setStyle(isLocked ? ButtonStyle.Success : ButtonStyle.Danger);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_lock_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(btn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};
