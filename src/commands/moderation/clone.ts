import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'clone',
  aliases: ['cl'],
  category: 'Moderation',
  description: 'Clone a channel.',
  usageSlash: '/clone [channel] [name]',
  usagePrefix: '??clone [channel] [new_name]',
  examples: ['??clone', '??clone #general general-2'],
  permissions: ['MANAGE_CHANNELS'],
  modRoleAllowed: false,
  cooldown: 10,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('clone')
    .setDescription('Clone a channel.')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to clone'))
    .addStringOption(o => o.setName('name').setDescription('Name for the new channel')),

  async execute(ctx: any) {
    await ctx.defer();
    const channel = (ctx.isSlash ? ctx.interaction.options.getChannel('channel') : null) || ctx.channel;
    const newName = ctx.isSlash ? (ctx.interaction.options.getString('name') || `${channel.name}-clone`) : (ctx.args[0] || `${channel.name}-clone`);
    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Channel} Clone Channel`).addFields(
      { name: 'Source', value: `${channel}` }, { name: 'New Name', value: newName }, { name: `${E.Crown} By`, value: ctx.user.tag },
    );
    const confirmBtn = new ButtonBuilder().setCustomId(`velora_clone_confirm_${channel.id}_${encodeURIComponent(newName)}_${ctx.user.id}`).setLabel('Confirm Clone').setStyle(ButtonStyle.Primary);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_clone_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};
