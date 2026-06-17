import { SlashCommandBuilder, EmbedBuilder, ChannelType } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'channelinfo',
  aliases: ['chi'],
  category: 'Info',
  description: 'View information about a channel.',
  usageSlash: '/channelinfo [channel]',
  usagePrefix: '??channelinfo [channel]',
  examples: ['??channelinfo', '??channelinfo #general'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('channelinfo')
    .setDescription('View information about a channel.')
    .addChannelOption(o => o.setName('channel').setDescription('Channel')),

  async execute(ctx: any) {
    await ctx.defer();
    const channel = (ctx.isSlash ? ctx.interaction.options.getChannel('channel') : await ctx.resolveChannel(ctx.args[0])) || ctx.channel;
    if (!channel) return ctx.reply({ content: `${E.Cross} Channel not found.`, ephemeral: true });

    const typeNames: Record<number, string> = { 0: 'Text', 2: 'Voice', 4: 'Category', 5: 'Announcement', 11: 'Thread', 15: 'Forum' };
    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Channel} ${channel.name}`)
      .addFields(
        { name: 'ID', value: channel.id, inline: true },
        { name: 'Type', value: typeNames[channel.type] || 'Unknown', inline: true },
        { name: 'Slowmode', value: (channel as any).rateLimitPerUser ? `${(channel as any).rateLimitPerUser}s` : 'None', inline: true },
        { name: 'Created', value: `<t:${Math.floor(channel.createdTimestamp! / 1000)}:F>` },
        { name: 'Topic', value: (channel as any).topic || 'None' },
      );

    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};
