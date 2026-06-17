import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'purge',
  aliases: ['p', 'clear'],
  category: 'Moderation',
  description: 'Bulk delete messages from a channel.',
  usageSlash: '/purge <amount> [filter] [user]',
  usagePrefix: '??purge <amount> [filter] [user]',
  examples: ['??purge 50', '??purge 20 bots', '??p 100 images'],
  permissions: ['MANAGE_MESSAGES'],
  modRoleAllowed: true,
  cooldown: 5,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages from a channel.')
    .addIntegerOption(o => o.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addStringOption(o => o.setName('filter').setDescription('Filter type').addChoices(
      { name: 'All', value: 'all' }, { name: 'Bots', value: 'bots' }, { name: 'Humans', value: 'humans' },
      { name: 'Embeds', value: 'embeds' }, { name: 'Images', value: 'images' }, { name: 'Links', value: 'links' },
    ))
    .addUserOption(o => o.setName('user').setDescription('Filter by specific user')),

  async execute(ctx: any) {
    await ctx.defer();
    const amount = ctx.isSlash ? ctx.interaction.options.getInteger('amount') : parseInt(ctx.args[0]);
    if (!amount || amount < 1 || amount > 100) return ctx.sendInvalidUsage();
    const filter = ctx.isSlash ? (ctx.interaction.options.getString('filter') || 'all') : (ctx.args[1] || 'all');

    const embed = new EmbedBuilder().setColor(Colors.BAN).setTitle(`${E.Purge} Purge Confirmation`).addFields(
      { name: `${E.Messages} Amount`, value: `${amount} messages` },
      { name: `${E.Channel} Channel`, value: `${ctx.channel}` },
      { name: `${E.User} Filter`, value: filter },
      { name: `${E.Crown} Moderator`, value: ctx.user.tag },
    );

    const confirmBtn = new ButtonBuilder().setCustomId(`velora_purge_confirm_${amount}_${filter}_${ctx.user.id}`).setLabel('Confirm Purge').setStyle(ButtonStyle.Danger);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_purge_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};
