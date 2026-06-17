import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'nuke',
  aliases: ['n'],
  category: 'Moderation',
  description: 'Nuke a channel (clone and delete).',
  usageSlash: '/nuke [channel] [reason]',
  usagePrefix: '??nuke [channel] [reason]',
  examples: ['??nuke', '??nuke #spam Cleanup'],
  permissions: ['MANAGE_CHANNELS'],
  modRoleAllowed: false,
  cooldown: 10,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Nuke a channel (clone and delete to clear all messages).')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to nuke'))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(ctx: any) {
    await ctx.defer();
    const channel = (ctx.isSlash ? ctx.interaction.options.getChannel('channel') : null) || ctx.channel;
    const reason = ctx.isSlash ? (ctx.interaction.options.getString('reason') || 'No reason provided') : (ctx.args.join(' ') || 'No reason provided');

    const embed = new EmbedBuilder().setColor(Colors.BAN).setTitle(`${E.Purge} Nuke Confirmation`)
      .setDescription(`This will **permanently delete ALL messages** in ${channel} by cloning and deleting it.\n\n**This action CANNOT be undone.**`)
      .addFields({ name: `${E.Channel} Channel`, value: `${channel}` }, { name: `${E.Crown} By`, value: ctx.user.tag }, { name: `${E.Reason} Reason`, value: reason });

    const confirmBtn = new ButtonBuilder().setCustomId(`velora_nuke_confirm_${channel.id}_${encodeURIComponent(reason)}_${ctx.user.id}`).setLabel('Confirm Nuke (5s...)').setStyle(ButtonStyle.Danger).setDisabled(true);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_nuke_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) {
      setTimeout(async () => { confirmBtn.setLabel('Confirm Nuke').setDisabled(false); try { await msg.edit({ components: rows }); } catch {} }, 5000);
      attachAutoDisable(msg, rows, 30_000);
    }
  },
};
