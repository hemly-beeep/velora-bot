import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'move',
  aliases: ['mv'],
  category: 'Messages',
  description: 'Move a message to another channel.',
  usageSlash: '/move <message_id> <channel>',
  usagePrefix: '??move <message_id> <channel>',
  examples: ['??move 1234567890 #general'],
  permissions: ['MANAGE_MESSAGES'],
  modRoleAllowed: true,
  cooldown: 5,
  minArgs: 2,
  slashData: new SlashCommandBuilder()
    .setName('move')
    .setDescription('Move a message to another channel.')
    .addStringOption(o => o.setName('message_id').setDescription('Message ID').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Target channel').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const msgId = ctx.isSlash ? ctx.interaction.options.getString('message_id') : ctx.args[0];
    const targetChannel = ctx.isSlash ? ctx.interaction.options.getChannel('channel') : await ctx.resolveChannel(ctx.args[1]);
    if (!msgId || !targetChannel) return ctx.sendInvalidUsage();

    const targetMsg = await ctx.channel.messages.fetch(msgId).catch(() => null);
    if (!targetMsg) return ctx.reply({ content: `${E.Cross} Could not find that message.`, ephemeral: true });

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Reply} Move Message`)
      .addFields(
        { name: 'Preview', value: (targetMsg.content || '[no text]').slice(0, 100) },
        { name: 'From', value: `${ctx.channel}` },
        { name: 'To', value: `${targetChannel}` },
      );
    const confirmBtn = new ButtonBuilder().setCustomId(`velora_move_confirm_${ctx.channel.id}_${msgId}_${(targetChannel as any).id}_${ctx.user.id}`).setLabel('Move Message').setStyle(ButtonStyle.Primary);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_move_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};
