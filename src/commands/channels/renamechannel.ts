import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'renamechannel',
  aliases: ['rc', 'rench'],
  category: 'Channels',
  description: 'Rename a channel.',
  usageSlash: '/renamechannel <new_name> [channel]',
  usagePrefix: '??renamechannel <new_name> [channel]',
  examples: ['??renamechannel new-name', '??renamechannel cool-channel #old-name'],
  permissions: ['MANAGE_CHANNELS'],
  modRoleAllowed: true,
  cooldown: 5,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('renamechannel')
    .setDescription('Rename a channel.')
    .addStringOption(o => o.setName('new_name').setDescription('New name').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel to rename')),

  async execute(ctx: any) {
    await ctx.defer();
    const newName = ctx.isSlash ? ctx.interaction.options.getString('new_name') : ctx.args[0];
    const channel = (ctx.isSlash ? ctx.interaction.options.getChannel('channel') : await ctx.resolveChannel(ctx.args[1])) || ctx.channel;
    if (!newName) return ctx.sendInvalidUsage();

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Edit} Rename Channel`).addFields(
      { name: 'Before', value: channel.name }, { name: 'After', value: newName },
    );
    const confirmBtn = new ButtonBuilder().setCustomId(`velora_renamechannel_confirm_${channel.id}_${encodeURIComponent(newName)}_${ctx.user.id}`).setLabel('Confirm Rename').setStyle(ButtonStyle.Primary);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_renamechannel_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};
