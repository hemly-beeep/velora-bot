import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'cry',
  aliases: ['sob'],
  category: 'Reactions',
  description: 'Cry.',
  usageSlash: '/cry',
  usagePrefix: '??cry',
  examples: ['??cry'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('cry')
    .setDescription('Cry.'),

  async execute(ctx: any) {
    await ctx.defer();
    const embed = new EmbedBuilder()
      .setColor(Colors.INFO)
      .setTitle(`${E.Mail} Cry`)
      .setDescription(`**${ctx.user.username}** is crying...`)
      .setFooter({ text: 'It will be okay!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};
