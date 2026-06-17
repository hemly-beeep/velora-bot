import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'pin',
  aliases: ['pn'],
  category: 'Moderation',
  description: 'Pin or unpin a message.',
  usageSlash: '/pin <message_id> [channel]',
  usagePrefix: '??pin <message_id> [channel]',
  examples: ['??pin 1234567890123456789'],
  permissions: ['MANAGE_MESSAGES'],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('pin')
    .setDescription('Pin or unpin a message.')
    .addStringOption(o => o.setName('message_id').setDescription('Message ID').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel containing the message')),

  async execute(ctx: any) {
    await ctx.defer();
    const msgId = ctx.isSlash ? ctx.interaction.options.getString('message_id') : ctx.args[0];
    const channel = (ctx.isSlash ? ctx.interaction.options.getChannel('channel') : null) || ctx.channel;
    const targetMsg = await channel.messages.fetch(msgId).catch(() => null);
    if (!targetMsg) return ctx.reply({ content: `${E.Cross} Could not find that message.`, ephemeral: true });

    const isPinned = targetMsg.pinned;
    const preview = targetMsg.content?.slice(0, 100) || '[No text content]';
    const embed = new EmbedBuilder().setColor(isPinned ? Colors.BAN : Colors.INFO)
      .setTitle(isPinned ? `${E.Pin} Unpin Message` : `${E.Pin} Pin Message`)
      .addFields(
        { name: `${E.Messages} Preview`, value: `"${preview}"` },
        { name: `${E.User} Author`, value: `${targetMsg.author.tag}` },
      );
    const btn = new ButtonBuilder().setCustomId(`velora_pin_toggle_${channel.id}_${msgId}_${isPinned ? 'unpin' : 'pin'}_${ctx.user.id}`).setLabel(isPinned ? 'Unpin Message' : 'Pin Message').setStyle(isPinned ? ButtonStyle.Danger : ButtonStyle.Primary);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_pin_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(btn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};
