import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'slowmode',
  aliases: ['sm'],
  category: 'Moderation',
  description: 'Set slowmode for a channel.',
  usageSlash: '/slowmode [duration] [channel] [reason]',
  usagePrefix: '??slowmode [duration] [channel] [reason]',
  examples: ['??slowmode 5s', '??slowmode off'],
  permissions: ['MANAGE_CHANNELS'],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for a channel.')
    .addStringOption(o => o.setName('duration').setDescription('Duration (e.g. 5s, 1m, or "off")'))
    .addChannelOption(o => o.setName('channel').setDescription('Channel to set slowmode in'))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(ctx: any) {
    await ctx.defer();
    const channel = ctx.channel;
    const reason = ctx.isSlash ? (ctx.interaction.options.getString('reason') || 'No reason provided') : 'No reason provided';

    const preset = new StringSelectMenuBuilder().setCustomId(`velora_slowmode_preset_${channel.id}_${encodeURIComponent(reason)}_${ctx.user.id}`).setPlaceholder('Select slowmode duration...').addOptions(
      { label: 'Off (0s)', value: '0' }, { label: '5 seconds', value: '5' },
      { label: '10 seconds', value: '10' }, { label: '30 seconds', value: '30' },
      { label: '1 minute', value: '60' }, { label: '2 minutes', value: '120' },
      { label: '5 minutes', value: '300' }, { label: '10 minutes', value: '600' },
    );

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Slowmode} Set Slowmode`).addFields(
      { name: `${E.Channel} Channel`, value: `${channel}` },
      { name: `${E.Slowmode} Current`, value: `${(channel as any).rateLimitPerUser || 0}s` },
    );

    const rows = withClose([new ActionRowBuilder<any>().addComponents(preset)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};
