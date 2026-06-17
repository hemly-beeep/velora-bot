import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'say',
  aliases: ['echo'],
  category: 'Messages',
  description: 'Make the bot say a message.',
  usageSlash: '/say <message> [channel] [embed]',
  usagePrefix: '??say <message>',
  examples: ['??say Hello everyone!'],
  permissions: ['MANAGE_MESSAGES'],
  modRoleAllowed: true,
  cooldown: 5,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say a message.')
    .addStringOption(o => o.setName('message').setDescription('Message to send').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Target channel'))
    .addBooleanOption(o => o.setName('embed').setDescription('Send as embed')),

  async execute(ctx: any) {
    await ctx.defer();
    const message = ctx.isSlash ? ctx.interaction.options.getString('message') : ctx.args.join(' ');
    const channel = (ctx.isSlash ? ctx.interaction.options.getChannel('channel') : null) || ctx.channel;
    const asEmbed = ctx.isSlash ? (ctx.interaction.options.getBoolean('embed') ?? false) : false;
    if (!message) return ctx.sendInvalidUsage();

    const confirmBtn = new ButtonBuilder().setCustomId(`velora_say_confirm_${channel.id}_${encodeURIComponent(message)}_${asEmbed ? '1' : '0'}_${ctx.user.id}`).setLabel('Send').setStyle(ButtonStyle.Success);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_say_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const preview = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Messages} Preview`).setDescription(message).setFooter({ text: `Sending to #${(channel as any).name}` });
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [preview], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};
