import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'blush',
  aliases: [],
  category: 'Reactions',
  description: 'Blush.',
  usageSlash: '/blush',
  usagePrefix: '??blush',
  examples: ['??blush'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('blush')
    .setDescription('Blush.'),

  async execute(ctx: any) {
    await ctx.defer();
    const embed = new EmbedBuilder()
      .setColor(Colors.WARN)
      .setTitle(`${E.Crown} Blush`)
      .setDescription(`**${ctx.user.username}** is blushing!`)
      .setFooter({ text: 'How cute!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};
