import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'deletechannel',
  aliases: ['dc', 'delchannel'],
  category: 'Channels',
  description: 'Delete a channel.',
  usageSlash: '/deletechannel [channel] [reason]',
  usagePrefix: '??deletechannel [channel] [reason]',
  examples: ['??deletechannel #old-chat'],
  permissions: ['MANAGE_CHANNELS'],
  modRoleAllowed: false,
  cooldown: 10,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('deletechannel')
    .setDescription('Delete a channel.')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to delete'))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(ctx: any) {
    await ctx.defer();
    const channel = (ctx.isSlash ? ctx.interaction.options.getChannel('channel') : await ctx.resolveChannel(ctx.args[0])) || ctx.channel;
    const reason = ctx.isSlash ? (ctx.interaction.options.getString('reason') || 'No reason') : (ctx.args.slice(1).join(' ') || 'No reason');

    const embed = new EmbedBuilder().setColor(Colors.BAN).setTitle(`${E.Channel} Delete Channel Confirmation`)
      .setDescription(`This will permanently delete **${channel.name}**.`)
      .addFields({ name: 'Channel', value: `${channel}` }, { name: 'Reason', value: reason });
    const confirmBtn = new ButtonBuilder().setCustomId(`velora_deletechannel_confirm_${channel.id}_${encodeURIComponent(reason)}_${ctx.user.id}`).setLabel('Delete Channel').setStyle(ButtonStyle.Danger).setDisabled(true);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_deletechannel_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) {
      setTimeout(async () => { confirmBtn.setDisabled(false); try { await msg.edit({ components: rows }); } catch {} }, 3000);
      attachAutoDisable(msg, rows, 30_000);
    }
  },
};
