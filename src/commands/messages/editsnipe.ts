import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export const editedMessages = new Map<string, any[]>();

export default {
  name: 'editsnipe',
  aliases: ['esnipe', 'es'],
  category: 'Messages',
  description: 'View recently edited messages.',
  usageSlash: '/editsnipe [channel]',
  usagePrefix: '??editsnipe [channel]',
  examples: ['??editsnipe'],
  permissions: [],
  modRoleAllowed: true,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('editsnipe')
    .setDescription('View recently edited messages.')
    .addChannelOption(o => o.setName('channel').setDescription('Channel')),

  async execute(ctx: any) {
    await ctx.defer();
    const channel = (ctx.isSlash ? ctx.interaction.options.getChannel('channel') : await ctx.resolveChannel(ctx.args[0])) || ctx.channel;
    const snipes = editedMessages.get(channel.id) || [];
    if (snipes.length === 0) return ctx.reply({ content: `${E.Cross} No recently edited messages.`, ephemeral: true });

    const latest = snipes[snipes.length - 1];
    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Edit} Edit Sniped Message`)
      .setAuthor({ name: latest.author, iconURL: latest.avatarURL })
      .addFields({ name: 'Before', value: latest.before || '[empty]' }, { name: 'After', value: latest.after || '[empty]' })
      .setTimestamp(latest.editedAt);

    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};
