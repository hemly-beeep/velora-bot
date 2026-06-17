import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export const deletedMessages = new Map<string, any[]>();

export default {
  name: 'snipe',
  aliases: ['sn'],
  category: 'Messages',
  description: 'View recently deleted messages.',
  usageSlash: '/snipe [channel]',
  usagePrefix: '??snipe [channel]',
  examples: ['??snipe', '??snipe #general'],
  permissions: [],
  modRoleAllowed: true,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('snipe')
    .setDescription('View recently deleted messages.')
    .addChannelOption(o => o.setName('channel').setDescription('Channel')),

  async execute(ctx: any) {
    await ctx.defer();
    const channel = (ctx.isSlash ? ctx.interaction.options.getChannel('channel') : await ctx.resolveChannel(ctx.args[0])) || ctx.channel;
    const snipes = deletedMessages.get(channel.id) || [];
    if (snipes.length === 0) return ctx.reply({ content: `${E.Cross} No recently deleted messages in ${channel}.`, ephemeral: true });

    const latest = snipes[snipes.length - 1];
    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Purge} Sniped Message`)
      .setAuthor({ name: latest.author, iconURL: latest.avatarURL })
      .setDescription(latest.content || '[No text content]')
      .setFooter({ text: `In #${latest.channelName}` })
      .setTimestamp(latest.deletedAt);

    if (latest.attachments?.length) embed.setImage(latest.attachments[0]);
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};
